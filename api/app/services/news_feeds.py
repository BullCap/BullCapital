"""RSS news aggregator for Brazilian financial outlets.

Complements yfinance's per-ticker news with broader pt-BR coverage. Fetched feeds
are cached in-memory for a short TTL since RSS sources publish in bursts and we
do not want to hammer them on every request.
"""

from __future__ import annotations

import asyncio
import html
import re
import time
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from xml.etree import ElementTree as ET

import httpx

# ── Sources ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class RssSource:
    publisher: str
    url: str
    slug: str

RSS_SOURCES: tuple[RssSource, ...] = (
    RssSource("InfoMoney", "https://www.infomoney.com.br/feed/", "infomoney"),
    RssSource("InfoMoney Mercados", "https://www.infomoney.com.br/mercados/feed/", "infomoney_mercados"),
    RssSource("Brazil Journal", "https://braziljournal.com/feed/", "brazil_journal"),
    RssSource("Valor Investe", "https://valorinveste.globo.com/rss/valorinveste/", "valor_investe"),
    RssSource("Money Times", "https://www.moneytimes.com.br/feed/", "money_times"),
)

REQUEST_TIMEOUT = 6.0
CACHE_TTL_SECONDS = 300  # 5 min — RSS feeds update in bursts; 5 min keeps us fresh without hammering
OG_FETCH_TIMEOUT = 4.0
OG_FETCH_MAX_BYTES = 65536  # Article <head> always fits — no need to download the full body

CONTENT_NS = "{http://purl.org/rss/1.0/modules/content/}"

# Query params common to WP/CDN-resized thumbnails. Stripping them upgrades the URL
# to the original full-size image without changing the path.
_LOW_RES_QUERY_KEYS = {"fit", "resize", "w", "h", "quality", "strip", "crop"}

# Tracking pixels and 1x1 placeholders that some feeds embed in <description>.
_BAD_IMAGE_PATTERNS = (
    "feedburner.com",
    "feedsportal.com",
    "doubleclick.net",
    "1x1",
    "spacer.gif",
    "pixel.gif",
)

_OG_IMAGE_RE = re.compile(
    r'<meta[^>]+(?:property|name)=["\']og:image(?::secure_url)?["\'][^>]*content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)
_TWITTER_IMAGE_RE = re.compile(
    r'<meta[^>]+name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)

# Common B3 ticker pattern: 4 letters + 1-2 digits, optionally followed by F (units)
TICKER_PATTERN = re.compile(r"\b([A-Z]{4})(\d{1,2})(F?)\b")

# Common company aliases → primary ticker, to catch headlines that name the company
# rather than the ticker. Keep conservative — only well-known unambiguous mappings.
COMPANY_ALIASES: dict[str, str] = {
    "petrobras": "PETR4",
    "vale": "VALE3",
    "itaú": "ITUB4",
    "itau": "ITUB4",
    "bradesco": "BBDC4",
    "ambev": "ABEV3",
    "magalu": "MGLU3",
    "magazine luiza": "MGLU3",
    "weg": "WEGE3",
    "suzano": "SUZB3",
    "gerdau": "GGBR4",
    "embraer": "EMBR3",
    "jbs": "JBSS3",
    "b3": "B3SA3",
    "eletrobras": "ELET3",
    "natura": "NTCO3",
    "renner": "LREN3",
    "lojas renner": "LREN3",
    "ultrapar": "UGPA3",
    "raia drogasil": "RADL3",
    "raízen": "RAIZ4",
    "raizen": "RAIZ4",
    "klabin": "KLBN11",
    "hapvida": "HAPV3",
    "rede d'or": "RDOR3",
    "rede dor": "RDOR3",
    "ibovespa": "^BVSP",
    "ibov": "^BVSP",
}

_cache: dict[str, tuple[float, list[dict]]] = {}


def _strip_html(value: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", value or "")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _parse_published(raw: str | None) -> int:
    if not raw:
        return 0
    try:
        dt = parsedate_to_datetime(raw)
        return int(dt.timestamp())
    except (TypeError, ValueError):
        return 0


def _is_bad_image(url: str) -> bool:
    lowered = url.lower()
    return any(pattern in lowered for pattern in _BAD_IMAGE_PATTERNS)


def _upgrade_image_url(url: str | None) -> str | None:
    """Strip WP/CDN low-res query params and decode XML entities to upgrade image quality."""
    if not url:
        return None
    decoded = html.unescape(url).strip()
    if not decoded:
        return None
    try:
        parsed = urlparse(decoded)
    except ValueError:
        return decoded
    if not parsed.query:
        return decoded
    kept_params = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=False) if k.lower() not in _LOW_RES_QUERY_KEYS]
    return urlunparse(parsed._replace(query=urlencode(kept_params)))


def _largest_media_image(item: ET.Element) -> str | None:
    """Pick the highest-resolution <media:content> child when multiple are advertised."""
    media_ns = "{http://search.yahoo.com/mrss/}"
    best_url: str | None = None
    best_area = -1
    for media in item.findall(f"{media_ns}content"):
        url = media.get("url")
        if not url:
            continue
        try:
            width = int(media.get("width") or 0)
            height = int(media.get("height") or 0)
        except ValueError:
            width = height = 0
        area = width * height
        if area > best_area:
            best_area = area
            best_url = url
    return best_url


def _images_from_html(content: str) -> list[str]:
    if not content:
        return []
    found: list[str] = []
    for match in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', content, re.IGNORECASE):
        url = match.group(1).strip()
        if url and not _is_bad_image(url):
            found.append(url)
    return found


def _extract_image(item: ET.Element) -> str | None:
    candidates: list[str] = []

    # <media:content url="..." width="..." height="..."/> — prefer largest
    largest_media = _largest_media_image(item)
    if largest_media:
        candidates.append(largest_media)

    media_ns = "{http://search.yahoo.com/mrss/}"
    thumb = item.find(f"{media_ns}thumbnail")
    if thumb is not None and thumb.get("url"):
        candidates.append(thumb.get("url"))

    enclosure = item.find("enclosure")
    if enclosure is not None:
        url = enclosure.get("url")
        type_ = (enclosure.get("type") or "").lower()
        if url and (type_.startswith("image") or not type_):
            candidates.append(url)

    # <content:encoded> usually has the full-resolution hero image in <p><img></p>
    content_encoded = item.findtext(f"{CONTENT_NS}encoded") or ""
    candidates.extend(_images_from_html(content_encoded))

    desc = item.findtext("description") or ""
    candidates.extend(_images_from_html(desc))

    for raw in candidates:
        upgraded = _upgrade_image_url(raw)
        if upgraded and not _is_bad_image(upgraded):
            return upgraded
    return None


async def fetch_og_image(client: httpx.AsyncClient, article_url: str) -> str | None:
    """Fetch the article's <head> and return its og:image (or twitter:image fallback)."""
    if not article_url:
        return None
    try:
        response = await client.get(
            article_url,
            follow_redirects=True,
            timeout=OG_FETCH_TIMEOUT,
            headers={"Accept": "text/html"},
        )
        response.raise_for_status()
    except (httpx.HTTPError, httpx.HTTPStatusError):
        return None

    body = response.text[:OG_FETCH_MAX_BYTES]
    for pattern in (_OG_IMAGE_RE, _TWITTER_IMAGE_RE):
        match = pattern.search(body)
        if match:
            return _upgrade_image_url(html.unescape(match.group(1)))
    return None


def _parse_rss_payload(payload: bytes) -> list[dict]:
    try:
        root = ET.fromstring(payload)
    except ET.ParseError:
        return []

    # Both RSS 2.0 (channel/item) and Atom (feed/entry) are common.
    items: list[dict] = []

    for item in root.iter("item"):
        title = _strip_html(item.findtext("title") or "")
        link = (item.findtext("link") or "").strip()
        description = _strip_html(item.findtext("description") or "")
        published_at = _parse_published(item.findtext("pubDate"))
        image = _extract_image(item)
        if title and link:
            items.append(
                {
                    "title": title,
                    "summary": description[:280],
                    "link": link,
                    "publishedAt": published_at,
                    "imageUrl": image,
                }
            )

    # Atom fallback
    atom_ns = "{http://www.w3.org/2005/Atom}"
    for entry in root.iter(f"{atom_ns}entry"):
        title = _strip_html(entry.findtext(f"{atom_ns}title") or "")
        link_elem = entry.find(f"{atom_ns}link")
        link = (link_elem.get("href") if link_elem is not None else "") or ""
        summary = _strip_html(entry.findtext(f"{atom_ns}summary") or entry.findtext(f"{atom_ns}content") or "")
        published_at = _parse_published(entry.findtext(f"{atom_ns}published") or entry.findtext(f"{atom_ns}updated"))
        if title and link:
            items.append(
                {
                    "title": title,
                    "summary": summary[:280],
                    "link": link.strip(),
                    "publishedAt": published_at,
                    "imageUrl": None,
                }
            )

    return items


async def _fetch_source(client: httpx.AsyncClient, source: RssSource) -> list[dict]:
    cached = _cache.get(source.slug)
    now = time.time()
    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    try:
        response = await client.get(source.url, follow_redirects=True)
        response.raise_for_status()
        items = _parse_rss_payload(response.content)
    except (httpx.HTTPError, httpx.HTTPStatusError):
        items = cached[1] if cached else []
    else:
        for item in items:
            item["publisher"] = source.publisher
            item["sourceSlug"] = source.slug

    _cache[source.slug] = (now, items)
    return items


async def _backfill_og_images(client: httpx.AsyncClient, items: list[dict], max_concurrent: int = 8) -> None:
    """For items without an RSS image, scrape og:image from the article page (in-place)."""
    targets = [item for item in items if not item.get("imageUrl") and item.get("link")]
    if not targets:
        return

    semaphore = asyncio.Semaphore(max_concurrent)

    async def fill_one(item: dict) -> None:
        async with semaphore:
            og_url = await fetch_og_image(client, item["link"])
            if og_url and not _is_bad_image(og_url):
                item["imageUrl"] = og_url

    await asyncio.gather(*(fill_one(item) for item in targets))


async def fetch_brazilian_news(
    per_source_limit: int = 25,
    backfill_images: bool = True,
) -> list[dict]:
    """Fetch news from all configured Brazilian RSS sources in parallel.

    When `backfill_images` is True, items without an RSS image have their article
    page scraped for og:image — fixes Money Times / Brazil Journal coverage.
    """
    headers = {
        "User-Agent": "BullCapital/1.0 (+https://bull.capital)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
    }
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, headers=headers) as client:
        results = await asyncio.gather(
            *(_fetch_source(client, source) for source in RSS_SOURCES),
            return_exceptions=True,
        )

        flat: list[dict] = []
        for result in results:
            if isinstance(result, list):
                flat.extend(result[:per_source_limit])

        if backfill_images:
            await _backfill_og_images(client, flat)

    return flat


def match_tickers(text: str) -> list[str]:
    """Best-effort ticker extraction from a piece of text (title + summary)."""
    if not text:
        return []

    found: set[str] = set()
    upper = text.upper()
    for match in TICKER_PATTERN.finditer(upper):
        prefix = match.group(1)
        digits = match.group(2)
        suffix = match.group(3) or ""
        # Filter out random 4-letter+digit acronyms by requiring real-looking ticker shape
        if len(digits) <= 2:
            found.add(f"{prefix}{digits}{suffix}")

    lowered = text.lower()
    for alias, ticker in COMPANY_ALIASES.items():
        if alias in lowered:
            found.add(ticker)

    return sorted(found)


async def get_news_for_ticker(ticker: str, limit: int = 10) -> list[dict]:
    """Return RSS-sourced news items mentioning the given ticker or its aliases."""
    if not ticker:
        return []

    all_items = await fetch_brazilian_news()
    target = ticker.upper()
    matched: list[dict] = []
    seen_links: set[str] = set()

    for item in all_items:
        link = item.get("link") or ""
        if not link or link in seen_links:
            continue
        text = f"{item.get('title', '')} {item.get('summary', '')}"
        tickers = match_tickers(text)
        if target in tickers or (target == "^BVSP" and "^BVSP" in tickers):
            seen_links.add(link)
            matched.append(
                {
                    "title": item["title"],
                    "originalTitle": None,
                    "publisher": item.get("publisher", "RSS"),
                    "link": link,
                    "publishedAt": item.get("publishedAt") or 0,
                    "imageUrl": item.get("imageUrl"),
                    "relatedTickers": tickers,
                }
            )

    matched.sort(key=lambda item: item.get("publishedAt") or 0, reverse=True)
    return matched[:limit]


async def get_latest_news(limit: int = 12) -> list[dict]:
    """Return the latest news items across all sources, deduped by link."""
    all_items = await fetch_brazilian_news()
    seen_links: set[str] = set()
    deduped: list[dict] = []
    for item in all_items:
        link = item.get("link") or ""
        if not link or link in seen_links:
            continue
        seen_links.add(link)
        text = f"{item.get('title', '')} {item.get('summary', '')}"
        deduped.append(
            {
                "title": item["title"],
                "originalTitle": None,
                "publisher": item.get("publisher", "RSS"),
                "link": link,
                "publishedAt": item.get("publishedAt") or 0,
                "imageUrl": item.get("imageUrl"),
                "relatedTickers": match_tickers(text),
            }
        )
    deduped.sort(key=lambda item: item.get("publishedAt") or 0, reverse=True)
    return deduped[:limit]

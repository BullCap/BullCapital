"""News ingestion: fetch RSS sources and persist deduped articles into Postgres."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

import httpx
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert

from app.core.database import async_session_maker
from app.models.market import NewsArticle
from app.services import news_feeds

logger = logging.getLogger(__name__)


def _to_dt(timestamp: int | None) -> datetime:
    if not timestamp or timestamp <= 0:
        return datetime.now(UTC)
    try:
        return datetime.fromtimestamp(int(timestamp), tz=UTC)
    except (ValueError, OSError, OverflowError):
        return datetime.now(UTC)


async def ingest_brazilian_news() -> dict[str, int]:
    """Fetch all configured RSS sources and persist deduped articles into Postgres.

    Articles are stored one row per (ticker, link). An article that mentions multiple
    tickers gets one row per ticker (fast WHERE ticker = ? lookup). Articles without
    any ticker match are stored under the index ticker ^BVSP so the latest-news feed
    still surfaces them as general-market news.
    """
    items = await news_feeds.fetch_brazilian_news()
    if not items:
        logger.info("RSS ingestion produced no items")
        return {"fetched": 0, "rows_inserted": 0, "articles": 0}

    rows_inserted = 0
    articles = 0

    async with async_session_maker() as session:
        for item in items:
            link = (item.get("link") or "").strip()
            title = (item.get("title") or "").strip()
            if not link or not title:
                continue

            articles += 1
            text = f"{title} {item.get('summary', '')}"
            tickers = news_feeds.match_tickers(text) or ["^BVSP"]
            published_at = _to_dt(item.get("publishedAt"))
            publisher = (item.get("publisher") or "RSS")[:100]
            image_url = item.get("imageUrl")
            category = f"rss:{item.get('sourceSlug', 'generic')}"

            for ticker in tickers:
                stmt = insert(NewsArticle).values(
                    ticker=ticker,
                    title=title,
                    original_title=None,
                    publisher=publisher,
                    link=link,
                    published_at=published_at,
                    image_url=image_url,
                    category=category,
                )
                stmt = stmt.on_conflict_do_nothing(constraint="uq_news_ticker_link")
                result = await session.execute(stmt)
                if result.rowcount and result.rowcount > 0:
                    rows_inserted += 1

        await session.commit()

    logger.info(
        "News ingestion: fetched=%d articles=%d rows_inserted=%d",
        len(items),
        articles,
        rows_inserted,
    )
    return {"fetched": len(items), "articles": articles, "rows_inserted": rows_inserted}


def _looks_low_quality(url: str | None) -> bool:
    """Detect WP/CDN thumbnail URLs that we can upgrade by stripping query params."""
    if not url:
        return False
    lowered = url.lower()
    return any(token in lowered for token in ("?fit=", "&fit=", "?resize=", "&resize=", "&quality=", "?quality=", "&w=", "?w="))


async def backfill_news_images() -> dict[str, int]:
    """Upgrade existing rows: clean low-res URLs and fetch og:image for the ones missing."""
    cleaned = 0
    scraped = 0
    skipped = 0
    scanned = 0

    async with async_session_maker() as session:
        # Avoid OOM and event loop locking by adding a LIMIT 200 on the scanning query
        result = await session.execute(
            select(NewsArticle)
            .order_by(NewsArticle.published_at.desc())
            .limit(200)
        )
        rows = list(result.scalars().all())

    # Keep track of original image_url to perform updates only when changed
    original_urls = {row.id: row.image_url for row in rows}

    # First pass: cheap URL cleanup, no network.
    by_link: dict[str, list[NewsArticle]] = {}
    for row in rows:
        scanned += 1
        upgraded = news_feeds._upgrade_image_url(row.image_url) if row.image_url else None
        if upgraded and upgraded != row.image_url and _looks_low_quality(row.image_url):
            row.image_url = upgraded
            cleaned += 1
        if not row.image_url:
            by_link.setdefault(row.link, []).append(row)

    # Second pass: fetch og:image for rows still without image, grouped by link.
    if by_link:
        headers = {"User-Agent": "BullCapital/1.0 (+https://bull.capital)", "Accept": "text/html"}
        async with httpx.AsyncClient(timeout=news_feeds.OG_FETCH_TIMEOUT, headers=headers) as client:
            semaphore = asyncio.Semaphore(8)

            async def resolve(link: str) -> tuple[str, str | None]:
                async with semaphore:
                    image = await news_feeds.fetch_og_image(client, link)
                    return link, image

            results = await asyncio.gather(*(resolve(link) for link in by_link))

        for link, image in results:
            if not image or news_feeds._is_bad_image(image):
                skipped += len(by_link[link])
                continue
            for row in by_link[link]:
                row.image_url = image
            scraped += len(by_link[link])

    # Update only the modified rows in batches of 50 to prevent OOM
    modified_rows = [row for row in rows if row.image_url != original_urls[row.id]]

    if modified_rows:
        async with async_session_maker() as session:
            chunk_size = 50
            for i in range(0, len(modified_rows), chunk_size):
                chunk = modified_rows[i : i + chunk_size]
                for row in chunk:
                    await session.execute(
                        update(NewsArticle)
                        .where(NewsArticle.id == row.id)
                        .values(image_url=row.image_url)
                    )
                await session.commit()

    logger.info(
        "Image backfill: scanned=%d cleaned=%d scraped=%d skipped=%d modified=%d",
        scanned, cleaned, scraped, skipped, len(modified_rows),
    )
    return {"scanned": scanned, "cleaned": cleaned, "scraped": scraped, "skipped": skipped}

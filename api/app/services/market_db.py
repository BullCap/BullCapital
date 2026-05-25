"""Database-backed market data querying and mapping service."""

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import desc, select

from app.core.database import async_session_maker
from app.models.market import AssetHistoricalPrice, AssetQuote, CurrencyQuote, MacroIndicator, NewsArticle
from app.services import news_ingest, yfinance_market
from app.services.bcb_sgs import ingest_macro_indicators, ingest_ptax_dollar
from app.services.market_ingest import (
    fetch_brapi_quotes_batch,
    ingest_all_quotes,
    ingest_asset_history,
    ingest_ticker_quote,
    upsert_quote_record,
)

logger = logging.getLogger(__name__)

QUOTE_TTL_MARKET_SECONDS = 300
QUOTE_TTL_CLOSED_SECONDS = 3600
NEWS_TTL_SECONDS = 900  # 15 min — RSS sources publish in bursts, no need to fetch on every read
NEWS_MAX_AGE_DAYS = 30  # Don't surface anything older than this from the cache

INDEX_NAMES = {
    "^BVSP": "Ibovespa",
    "^GSPC": "S&P 500",
    "^VIX": "VIX",
}
HISTORY_LIMITS = {
    "1d": 2,
    "5d": 8,
    "1mo": 32,
    "3mo": 90,
    "6mo": 186,
    "1y": 260,
    "2y": 520,
    "3y": 780,
    "5y": 1300,
    "10y": 2600,
    "15y": 3900,
    "16y": 4160,
    "max": 6000,
}


def _clean_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    if cleaned.endswith(".SA"):
        return cleaned[:-3]
    return cleaned


def _app_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    if cleaned == "BRL=X":
        return "USD-BRL"
    if cleaned.endswith("BRL=X"):
        return f"{cleaned[:-5]}-BRL"
    if cleaned.endswith(".SA"):
        return cleaned[:-3]
    return cleaned


def _is_b3_session() -> bool:
    now = datetime.now(ZoneInfo("America/Sao_Paulo"))
    hour = now.hour + now.minute / 60
    return now.weekday() < 5 and 10 <= hour < 17


def _quote_is_stale(updated_at: datetime | None) -> bool:
    if updated_at is None:
        return True
    now = datetime.now(UTC)
    quote_time = updated_at
    if quote_time.tzinfo is None:
        quote_time = quote_time.replace(tzinfo=UTC)
    ttl = QUOTE_TTL_MARKET_SECONDS if _is_b3_session() else QUOTE_TTL_CLOSED_SECONDS
    return (now - quote_time.astimezone(UTC)).total_seconds() > ttl


async def get_db_quote(symbol: str) -> dict | None:
    """Retrieve quote from the Postgres cache, triggering live ingest on-the-fly if missing."""
    clean_ticker = _clean_symbol(symbol)
    app_ticker = _app_symbol(symbol)

    from app.services.yfinance_market import _is_crypto
    if _is_crypto(clean_ticker) or clean_ticker.startswith("TESOURO_"):
        from app.services import yfinance_market
        return yfinance_market.get_quote(clean_ticker)

    async with async_session_maker() as session:
        result = await session.execute(
            select(AssetQuote).where(AssetQuote.ticker == clean_ticker)
        )
        quote = result.scalar_one_or_none()

    # Self-populating cache fallback: fetch live if not found or outside the 5-minute PRO TTL.
    if not quote or _quote_is_stale(quote.updated_at):
        reason = "not found" if not quote else "stale"
        logger.info(f"Quote for {clean_ticker} {reason} in database cache. Performing on-the-fly ingestion...")
        success = await ingest_ticker_quote(clean_ticker)
        if success:
            async with async_session_maker() as session:
                result = await session.execute(
                    select(AssetQuote).where(AssetQuote.ticker == clean_ticker)
                )
                quote = result.scalar_one_or_none()

    if not quote:
        return None

    # Map database row to the dictionary format expected by Next.js BFF
    return {
        "symbol": app_ticker,
        "shortName": quote.name,
        "longName": quote.name,
        "regularMarketPrice": quote.price,
        "regularMarketChangePercent": quote.change_percent,
        "regularMarketVolume": quote.volume,
        "marketCap": int(quote.market_cap) if quote.market_cap else 0,
        "logourl": "",
        "fiftyTwoWeekHigh": quote.high_52w or quote.price,
        "fiftyTwoWeekLow": quote.low_52w or quote.price,
        "sector": quote.sector,
        "industry": quote.industry,
        "website": "",
        "longBusinessSummary": quote.business_summary,
        "fullTimeEmployees": 0,
        "trailingPE": quote.pe_ratio or 0.0,
        "profitMargins": quote.roe or 0.0,  # fallback mapping
        "dividendYield": (quote.dividend_yield / 100.0) if quote.dividend_yield else 0.0,  # convert back to fraction for BFF
        "averageVolume": quote.volume,
        "evEbitda": quote.ev_ebitda,
        "roe": quote.roe,
        "roic": quote.roic,
        "pBook": quote.p_vp,
    }


async def get_db_quotes(symbols: list[str]) -> dict:
    """Retrieve quotes for many symbols, refreshing missing/stale rows via Brapi PRO batching."""
    if not symbols:
        return {"results": []}

    results = []
    other_symbols = []
    
    from app.services.yfinance_market import _is_crypto
    for s in symbols:
        clean = _clean_symbol(s)
        if _is_crypto(clean) or clean.startswith("TESOURO_"):
            from app.services import yfinance_market
            quote = yfinance_market.get_quote(clean)
            if quote:
                results.append(quote)
        else:
            other_symbols.append(s)
            
    if other_symbols:
        db_res = await _get_db_quotes_standard(other_symbols)
        results.extend(db_res.get("results", []))
        
    return {"results": results}


async def _get_db_quotes_standard(symbols: list[str]) -> dict:
    if not symbols:
        return {"results": []}

    clean_symbols = [_clean_symbol(s) for s in symbols]

    # 1. Load whatever is already in the cache, in a single query.
    async with async_session_maker() as session:
        result = await session.execute(
            select(AssetQuote).where(AssetQuote.ticker.in_(clean_symbols))
        )
        cached = {row.ticker: row for row in result.scalars().all()}

    # 2. Pick the ones that need an ingest call (missing or stale).
    stale_tickers = [
        ticker for ticker in clean_symbols
        if ticker not in cached or _quote_is_stale(cached[ticker].updated_at)
    ]

    # 3. Refresh stale tickers via Brapi PRO batch (up to 20 per call). Falls back to per-ticker.
    if stale_tickers:
        logger.info(f"Batch refreshing {len(stale_tickers)} stale/missing quotes via Brapi PRO...")
        chunk_size = 20
        for chunk_start in range(0, len(stale_tickers), chunk_size):
            chunk = stale_tickers[chunk_start : chunk_start + chunk_size]
            brapi_results = await fetch_brapi_quotes_batch(chunk)
            seen = set()
            for quote_data in brapi_results:
                symbol = str(quote_data.get("symbol", "")).strip().upper()
                if not symbol:
                    continue
                await upsert_quote_record(quote_data, symbol)
                seen.add(symbol)
            # Per-ticker fallback for anything the batch missed (e.g. delisted, yfinance).
            for missing in (t for t in chunk if t not in seen):
                await ingest_ticker_quote(missing)

        # Reload after upserts.
        async with async_session_maker() as session:
            result = await session.execute(
                select(AssetQuote).where(AssetQuote.ticker.in_(clean_symbols))
            )
            cached = {row.ticker: row for row in result.scalars().all()}

    # 4. Map rows back into the BFF dict shape, preserving input order.
    results = []
    for original, ticker in zip(symbols, clean_symbols):
        quote = cached.get(ticker)
        if not quote:
            continue
        app_ticker = _app_symbol(original)
        results.append({
            "symbol": app_ticker,
            "shortName": quote.name,
            "longName": quote.name,
            "regularMarketPrice": quote.price,
            "regularMarketChangePercent": quote.change_percent,
            "regularMarketVolume": quote.volume,
            "marketCap": int(quote.market_cap) if quote.market_cap else 0,
            "logourl": "",
            "fiftyTwoWeekHigh": quote.high_52w or quote.price,
            "fiftyTwoWeekLow": quote.low_52w or quote.price,
            "sector": quote.sector,
            "industry": quote.industry,
            "website": "",
            "longBusinessSummary": quote.business_summary,
            "fullTimeEmployees": 0,
            "trailingPE": quote.pe_ratio or 0.0,
            "profitMargins": quote.roe or 0.0,
            "dividendYield": (quote.dividend_yield / 100.0) if quote.dividend_yield else 0.0,
            "averageVolume": quote.volume,
            "evEbitda": quote.ev_ebitda,
            "roe": quote.roe,
            "roic": quote.roic,
            "pBook": quote.p_vp,
        })

    return {"results": results}


async def get_db_history(symbols: list[str], range_name: str = "1mo") -> dict:
    """Retrieve historical OHLCV from DB, self-populating with Brapi PRO when missing."""
    if not symbols:
        return {"results": [], "error": "No tickers provided."}

    results = []
    other_symbols = []
    
    from app.services.yfinance_market import _is_crypto
    for s in symbols:
        clean = _clean_symbol(s)
        if _is_crypto(clean) or clean.startswith("TESOURO_"):
            from app.services import yfinance_market
            hist = yfinance_market.get_history([clean], range_name)
            results.extend(hist.get("results", []))
        else:
            other_symbols.append(s)
            
    if other_symbols:
        db_res = await _get_db_history_standard(other_symbols, range_name)
        results.extend(db_res.get("results", []))
        
    return {"results": results}


async def _get_db_history_standard(symbols: list[str], range_name: str = "1mo") -> dict:
    if not symbols:
        return {"results": [], "error": "No tickers provided."}

    results = []
    for symbol in symbols:
        clean_ticker = _clean_symbol(symbol)
        app_ticker = _app_symbol(symbol)
        rows = []

        async with async_session_maker() as session:
            result = await session.execute(
                select(AssetHistoricalPrice)
                .where(AssetHistoricalPrice.ticker == clean_ticker)
                .order_by(AssetHistoricalPrice.date.desc())
                .limit(HISTORY_LIMITS.get(range_name, 32))
            )
            rows = list(reversed(result.scalars().all()))

        if not rows:
            logger.info(f"History for {clean_ticker} not found in database cache. Ingesting from Brapi PRO...")
            await ingest_asset_history(clean_ticker, range_name)
            async with async_session_maker() as session:
                result = await session.execute(
                    select(AssetHistoricalPrice)
                    .where(AssetHistoricalPrice.ticker == clean_ticker)
                    .order_by(AssetHistoricalPrice.date.desc())
                    .limit(HISTORY_LIMITS.get(range_name, 32))
                )
                rows = list(reversed(result.scalars().all()))

        if rows:
            results.append({
                "symbol": app_ticker,
                "history": [
                    {
                        "timestamp": int(datetime.combine(row.date, datetime.min.time(), tzinfo=UTC).timestamp()),
                        "open": row.open,
                        "high": row.high,
                        "low": row.low,
                        "close": row.close,
                        "volume": row.volume,
                    }
                    for row in rows
                ],
            })
            continue

        logger.info(f"History for {clean_ticker} still unavailable. Using yfinance fallback response.")
        live = await asyncio.to_thread(yfinance_market.get_history, [clean_ticker], range_name)
        results.extend(live.get("results", []))

    return {"results": results}


async def get_db_status() -> dict:
    """Retrieve status of major indices from database cache."""
    symbols = ["^BVSP", "^GSPC", "^VIX"]
    indices = []
    for symbol in symbols:
        quote = await get_db_quote(symbol)
        if not quote:
            continue
        app_symbol = quote["symbol"]
        indices.append(
            {
                "name": INDEX_NAMES.get(app_symbol, quote["shortName"]),
                "symbol": app_symbol,
                "regularMarketPrice": quote["regularMarketPrice"],
                "regularMarketChangePercent": quote["regularMarketChangePercent"],
            }
        )
    return {"indices": indices}


async def get_db_currencies(pairs: list[str]) -> dict:
    """Retrieve currency quotes from cache, with PTAX fallback."""
    currencies = []
    async with async_session_maker() as session:
        for pair in pairs:
            clean_pair = _clean_symbol(pair)
            result = await session.execute(
                select(CurrencyQuote).where(CurrencyQuote.pair == clean_pair)
            )
            quote = result.scalar_one_or_none()

            # If missing (e.g. USD-BRL PTAX not loaded yet)
            if not quote and clean_pair == "USD-BRL":
                logger.info("PTAX Dollar not in database. Triggering BCB SGS Dollar ingestion...")
                await ingest_ptax_dollar()
                result = await session.execute(
                    select(CurrencyQuote).where(CurrencyQuote.pair == clean_pair)
                )
                quote = result.scalar_one_or_none()

            if not quote:
                continue

            from_currency, to_currency = clean_pair.split("-") if "-" in clean_pair else (clean_pair, "BRL")
            currencies.append(
                {
                    "fromCurrency": from_currency,
                    "toCurrency": to_currency,
                    "name": f"{from_currency}/{to_currency}",
                    "bidPrice": quote.bid,
                    "askPrice": quote.ask,
                    "highPrice": quote.high,
                    "lowPrice": quote.low,
                    "updatedAtTimestamp": int(quote.updated_at.replace(tzinfo=UTC).timestamp()),
                }
            )
    return {"currencies": currencies}


async def get_db_indicators() -> dict:
    """Retrieve latest macro indicators (SELIC, IPCA) from database cache."""
    indicators = {"selic": [], "inflation": []}

    async with async_session_maker() as session:
        # Check if macro indicators exist, if empty trigger SGS sync
        selic_check = await session.execute(
            select(MacroIndicator).where(MacroIndicator.name == "SELIC").limit(1)
        )
        latest_selic = selic_check.scalar()
        if not latest_selic or latest_selic.created_at.replace(tzinfo=UTC).date() < datetime.now(UTC).date():
            logger.info("Macro indicators missing or stale. Performing Brapi PRO daily indicators sync...")
            await ingest_macro_indicators()

        # Query SELIC history
        selic_results = await session.execute(
            select(MacroIndicator)
            .where(MacroIndicator.name == "SELIC")
            .order_by(MacroIndicator.date.desc())
            .limit(10)
        )
        for row in selic_results.scalars():
            indicators["selic"].append({
                "date": row.date.strftime("%d/%m/%Y"),
                "value": row.value,
            })

        # Query IPCA history
        ipca_results = await session.execute(
            select(MacroIndicator)
            .where(MacroIndicator.name == "IPCA")
            .order_by(MacroIndicator.date.desc())
            .limit(10)
        )
        for row in ipca_results.scalars():
            indicators["inflation"].append({
                "date": row.date.strftime("%d/%m/%Y"),
                "value": row.value,
            })

    return indicators


async def get_db_listings(
    limit: int = 20,
    page: int = 1,
    sort_by: str = "name",
    sort_order: str = "asc",
    item_type: str | None = None,
    search: str | None = None,
) -> dict:
    """Retrieve listings of B3 assets from cache with fast sorting, searching, and pagination."""
    import math

    if item_type and item_type not in {"stock", "crypto", "fixed_income"}:
        return {
            "stocks": [],
            "indexes": [{"stock": symbol, "name": name} for symbol, name in INDEX_NAMES.items()],
            "currentPage": 1,
            "totalPages": 1,
            "totalCount": 0,
            "hasNextPage": False,
        }

    if item_type in {"crypto", "fixed_income"}:
        stocks = []
        if item_type == "crypto":
            from app.services.yfinance_market import CRYPTO_COINS, get_quote
            for coin in CRYPTO_COINS:
                q = get_quote(coin)
                if q:
                    stocks.append({
                        "stock": q["symbol"],
                        "name": q["longName"],
                        "close": q["regularMarketPrice"],
                        "change": q["regularMarketChangePercent"],
                        "volume": q["regularMarketVolume"],
                        "marketCap": q["marketCap"],
                        "logo": None,
                        "sector": "Cripto",
                        "type": "crypto",
                    })
        elif item_type == "fixed_income":
            from app.services.yfinance_market import TESOURO_BONDS, get_live_treasury_quote
            for bond_ticker in TESOURO_BONDS.keys():
                q = get_live_treasury_quote(bond_ticker)
                if q:
                    stocks.append({
                        "stock": q["symbol"],
                        "name": q["shortName"],
                        "close": q["regularMarketPrice"],
                        "change": q["regularMarketChangePercent"],
                        "volume": q["regularMarketVolume"],
                        "marketCap": 0,
                        "logo": None,
                        "sector": "Renda Fixa",
                        "type": "fixed_income",
                    })
        
        # Paginate results
        page_size = max(1, min(limit, 100))
        total_count = len(stocks)
        total_pages = max(1, math.ceil(total_count / page_size))
        current_page = max(1, min(page, total_pages))
        start = (current_page - 1) * page_size
        return {
            "stocks": stocks[start : start + page_size],
            "indexes": [{"stock": symbol, "name": name} for symbol, name in INDEX_NAMES.items()],
            "currentPage": current_page,
            "totalPages": total_pages,
            "totalCount": total_count,
            "hasNextPage": current_page < total_pages,
        }

    async with async_session_maker() as session:
        latest_result = await session.execute(
            select(AssetQuote.updated_at).order_by(AssetQuote.updated_at.desc()).limit(1)
        )
        latest_update = latest_result.scalar_one_or_none()

    if _quote_is_stale(latest_update):
        logger.info("Listings cache is stale. Refreshing B3 universe with Brapi PRO batch ingestion...")
        await ingest_all_quotes()

    async with async_session_maker() as session:
        query = select(AssetQuote)
        if search:
            needle = f"%{search.upper().strip()}%"
            query = query.where(AssetQuote.ticker.like(needle) | AssetQuote.name.like(needle))

        result = await session.execute(query)
        quotes = result.scalars().all()

    stocks = []
    for q in quotes:
        # Filter out indexes from main stock listings
        if q.ticker.startswith("^") or q.ticker.endswith("=X"):
            continue

        stocks.append(
            {
                "stock": _app_symbol(q.ticker),
                "name": q.name,
                "close": q.price,
                "change": q.change_percent,
                "volume": q.volume,
                "marketCap": q.market_cap,
                "logo": None,
                "sector": q.sector,
                "type": "stock",
            }
        )

    # Sort results
    reverse = sort_order == "desc"
    key_map = {
        "name": lambda item: item["name"],
        "close": lambda item: item["close"],
        "change": lambda item: item["change"],
        "change_abs": lambda item: abs(item["change"]),
        "volume": lambda item: item["volume"],
        "market_cap_basic": lambda item: item["marketCap"] or 0,
        "sector": lambda item: item["sector"] or "",
        "rank": lambda item: item["stock"],
    }
    stocks.sort(key=key_map.get(sort_by, key_map["name"]), reverse=reverse)

    # Paginate results
    page_size = max(1, min(limit, 100))
    total_count = len(stocks)
    total_pages = max(1, math.ceil(total_count / page_size))
    current_page = max(1, min(page, total_pages))
    start = (current_page - 1) * page_size

    return {
        "stocks": stocks[start : start + page_size],
        "indexes": [{"stock": symbol, "name": name} for symbol, name in INDEX_NAMES.items()],
        "currentPage": current_page,
        "totalPages": total_pages,
        "totalCount": total_count,
        "hasNextPage": current_page < total_pages,
    }


# ─── NEWS ─────────────────────────────────────────────────────────────────────

_last_news_ingest_at: datetime | None = None


def _news_row_to_dict(row: NewsArticle, primary_ticker: str | None = None) -> dict:
    return {
        "title": row.title,
        "originalTitle": row.original_title,
        "publisher": row.publisher,
        "link": row.link,
        "publishedAt": int(row.published_at.timestamp()) if row.published_at else 0,
        "imageUrl": row.image_url,
        "relatedTickers": [primary_ticker or row.ticker],
    }


async def _ingest_news_if_stale() -> None:
    """Trigger an RSS ingest if the in-process cache marker says it's stale.

    Cheap guard rail so multiple concurrent requests don't pile up RSS calls.
    The fetcher itself has its own per-feed cache (5 min) — this just avoids
    re-triggering the DB writes too often.
    """
    global _last_news_ingest_at
    now = datetime.now(UTC)
    if _last_news_ingest_at and (now - _last_news_ingest_at).total_seconds() < NEWS_TTL_SECONDS:
        return
    _last_news_ingest_at = now
    try:
        await news_ingest.ingest_brazilian_news()
    except Exception as exc:  # noqa: BLE001 — RSS sources are flaky; keep serving cache
        logger.warning("News ingestion failed: %s", exc)


async def get_db_news(ticker: str, count: int = 6) -> list[dict]:
    """Return cached news for a ticker, triggering an RSS ingest if cache is cold/stale."""
    if not ticker:
        return []

    clean_ticker = _clean_symbol(ticker)

    async with async_session_maker() as session:
        cutoff = datetime.now(UTC) - timedelta(days=NEWS_MAX_AGE_DAYS)
        result = await session.execute(
            select(NewsArticle)
            .where(NewsArticle.ticker == clean_ticker)
            .where(NewsArticle.published_at >= cutoff)
            .order_by(desc(NewsArticle.published_at))
            .limit(count * 2)
        )
        rows = result.scalars().all()

    if len(rows) < count:
        await _ingest_news_if_stale()
        async with async_session_maker() as session:
            result = await session.execute(
                select(NewsArticle)
                .where(NewsArticle.ticker == clean_ticker)
                .order_by(desc(NewsArticle.published_at))
                .limit(count * 2)
            )
            rows = result.scalars().all()

    return [_news_row_to_dict(row, clean_ticker) for row in rows[:count]]


async def get_db_latest_news(count: int = 12) -> list[dict]:
    """Return the latest news across all tickers, deduped by link."""
    await _ingest_news_if_stale()

    async with async_session_maker() as session:
        cutoff = datetime.now(UTC) - timedelta(days=NEWS_MAX_AGE_DAYS)
        result = await session.execute(
            select(NewsArticle)
            .where(NewsArticle.published_at >= cutoff)
            .order_by(desc(NewsArticle.published_at))
            .limit(count * 4)
        )
        rows = result.scalars().all()

    deduped: dict[str, dict] = {}
    for row in rows:
        existing = deduped.get(row.link)
        if existing is None:
            deduped[row.link] = _news_row_to_dict(row, row.ticker)
        elif row.ticker not in existing["relatedTickers"]:
            existing["relatedTickers"].append(row.ticker)

    items = sorted(
        deduped.values(),
        key=lambda item: item.get("publishedAt") or 0,
        reverse=True,
    )
    return items[:count]

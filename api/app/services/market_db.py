"""Database-backed market data querying and mapping service."""

import asyncio
import logging
import math
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import desc, func, select

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

# Keep strong references to prevent garbage collection of running background tasks
_bg_tasks: set[asyncio.Task] = set()

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


def _quote_needs_fundamentals_refresh(quote: AssetQuote | None) -> bool:
    """Refresh rows that have price data but missed Brapi fundamental modules."""
    if quote is None:
        return True
    return not any(
        value is not None
        for value in (
            quote.pe_ratio,
            quote.dividend_yield,
            quote.ev_ebitda,
            quote.roe,
            quote.roic,
            quote.p_vp,
            quote.sector,
            quote.industry,
            quote.business_summary,
        )
    )


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

    # Cache miss: fetch synchronously (no data to serve yet).
    if not quote:
        logger.info(f"Quote for {clean_ticker} not found in cache. Fetching live...")
        success = await ingest_ticker_quote(clean_ticker)
        if success:
            async with async_session_maker() as session:
                result = await session.execute(
                    select(AssetQuote).where(AssetQuote.ticker == clean_ticker)
                )
                quote = result.scalar_one_or_none()
    elif _quote_is_stale(quote.updated_at) or _quote_needs_fundamentals_refresh(quote):
        # Stale-while-revalidate: serve cached data immediately, refresh in background.
        reason = "missing fundamentals" if _quote_needs_fundamentals_refresh(quote) else "stale"
        t = asyncio.create_task(ingest_ticker_quote(clean_ticker))
        _bg_tasks.add(t)
        t.add_done_callback(_bg_tasks.discard)

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
        "profitMargins": 0.0,  # field not stored; don't confuse with ROE
        "dividendYield": (quote.dividend_yield / 100.0) if quote.dividend_yield else 0.0,  # convert back to fraction for BFF
        "averageVolume": quote.volume,
        "evEbitda": quote.ev_ebitda,
        "roe": quote.roe,
        "roic": quote.roic,
        "pBook": quote.p_vp,
        "updatedAt": quote.updated_at.replace(tzinfo=UTC).isoformat() if quote.updated_at else None,
        "isStale": _quote_is_stale(quote.updated_at),
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


async def _batch_fetch_and_upsert(tickers: list[str]) -> None:
    """Fetch a list of tickers from Brapi PRO (batched) and upsert to cache. Falls back to per-ticker."""
    chunk_size = 20
    for chunk_start in range(0, len(tickers), chunk_size):
        chunk = tickers[chunk_start : chunk_start + chunk_size]
        brapi_results = await fetch_brapi_quotes_batch(chunk)
        seen = set()
        for quote_data in brapi_results:
            symbol = str(quote_data.get("symbol", "")).strip().upper()
            if not symbol:
                continue
            await upsert_quote_record(quote_data, symbol)
            seen.add(symbol)
        for t in (t for t in chunk if t not in seen):
            await ingest_ticker_quote(t)


async def _background_refresh_quotes(tickers: list[str]) -> None:
    """Background Brapi PRO refresh; errors are swallowed so they don't crash the event loop."""
    try:
        await _batch_fetch_and_upsert(tickers)
    except Exception as exc:
        logger.warning("Background quote refresh failed: %s", exc)


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

    # 2. Separate truly missing (must block) from stale (serve now, refresh in background).
    missing_tickers = [t for t in clean_symbols if t not in cached]
    stale_tickers = [
        t for t in clean_symbols
        if t in cached and (
            _quote_is_stale(cached[t].updated_at) or _quote_needs_fundamentals_refresh(cached[t])
        )
    ]

    # 3. Missing tickers: fetch synchronously — there is no cached data to serve.
    if missing_tickers:
        logger.info(f"Fetching {len(missing_tickers)} missing quotes via Brapi PRO (blocking)...")
        await _batch_fetch_and_upsert(missing_tickers)
        async with async_session_maker() as session:
            result = await session.execute(
                select(AssetQuote).where(AssetQuote.ticker.in_(missing_tickers))
            )
            for row in result.scalars():
                cached[row.ticker] = row

    # 4. Stale tickers: return cached data immediately, refresh in background.
    if stale_tickers:
        logger.info(f"Background refresh for {len(stale_tickers)} stale quotes...")
        t = asyncio.create_task(_background_refresh_quotes(stale_tickers))
        _bg_tasks.add(t)
        t.add_done_callback(_bg_tasks.discard)

    # 5. Map rows back into the BFF dict shape, preserving input order.
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
            "profitMargins": 0.0,  # field not stored; don't confuse with ROE
            "dividendYield": (quote.dividend_yield / 100.0) if quote.dividend_yield else 0.0,
            "averageVolume": quote.volume,
            "evEbitda": quote.ev_ebitda,
            "roe": quote.roe,
            "roic": quote.roic,
            "pBook": quote.p_vp,
            "updatedAt": quote.updated_at.replace(tzinfo=UTC).isoformat() if quote.updated_at else None,
            "isStale": _quote_is_stale(quote.updated_at),
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


async def _fetch_symbol_history(symbol: str, range_name: str) -> list[dict]:
    """Fetch history for a single symbol: DB → Brapi → yfinance. Returns list of result entries."""
    clean_ticker = _clean_symbol(symbol)
    app_ticker = _app_symbol(symbol)

    async with async_session_maker() as session:
        result = await session.execute(
            select(AssetHistoricalPrice)
            .where(AssetHistoricalPrice.ticker == clean_ticker)
            .order_by(AssetHistoricalPrice.date.desc())
            .limit(HISTORY_LIMITS.get(range_name, 32))
        )
        rows = list(reversed(result.scalars().all()))

    if not rows:
        logger.info(f"History for {clean_ticker} not in cache. Ingesting from Brapi PRO...")
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
        return [{
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
        }]

    logger.info(f"History for {clean_ticker} still unavailable. Using yfinance fallback.")
    live = await asyncio.to_thread(yfinance_market.get_history, [clean_ticker], range_name)
    return live.get("results", [])


async def _get_db_history_standard(symbols: list[str], range_name: str = "1mo") -> dict:
    if not symbols:
        return {"results": [], "error": "No tickers provided."}

    # Fetch all symbols in parallel — critical for the comparator (2-4 assets at once).
    parts = await asyncio.gather(*[_fetch_symbol_history(s, range_name) for s in symbols])
    results = [entry for part in parts for entry in part]
    return {"results": results}


async def get_db_status() -> dict:
    """Retrieve status of major indices from database cache."""
    symbols = ["^BVSP", "^GSPC", "^VIX"]
    quotes = await asyncio.gather(*[get_db_quote(s) for s in symbols], return_exceptions=True)
    indices = []
    for symbol, quote in zip(symbols, quotes):
        if not quote or isinstance(quote, Exception):
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
    if not pairs:
        return {"currencies": []}

    clean_pairs = [_clean_symbol(pair) for pair in pairs]

    async with async_session_maker() as session:
        result = await session.execute(
            select(CurrencyQuote).where(CurrencyQuote.pair.in_(clean_pairs))
        )
        quotes = {q.pair: q for q in result.scalars().all()}

        # If missing (e.g. USD-BRL PTAX not loaded yet)
        if "USD-BRL" in clean_pairs and "USD-BRL" not in quotes:
            logger.info("PTAX Dollar not in database. Triggering BCB SGS Dollar ingestion...")
            await ingest_ptax_dollar()
            result = await session.execute(
                select(CurrencyQuote).where(CurrencyQuote.pair.in_(clean_pairs))
            )
            quotes = {q.pair: q for q in result.scalars().all()}

    currencies = []
    for pair in clean_pairs:
        quote = quotes.get(pair)
        if not quote:
            continue

        from_currency, to_currency = pair.split("-") if "-" in pair else (pair, "BRL")
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
        # Check if macro indicators exist, ordering by date desc to get the most recent record
        selic_check = await session.execute(
            select(MacroIndicator).where(MacroIndicator.name == "SELIC").order_by(MacroIndicator.date.desc()).limit(1)
        )
        latest_selic = selic_check.scalar()

        # Stale-while-revalidate: block only if database is completely empty
        if not latest_selic:
            logger.info("Macro indicators missing. Performing Brapi PRO daily indicators sync (blocking)...")
            await ingest_macro_indicators()
            # Fetch again after sync
            selic_check = await session.execute(
                select(MacroIndicator).where(MacroIndicator.name == "SELIC").order_by(MacroIndicator.date.desc()).limit(1)
            )
            latest_selic = selic_check.scalar()
        elif latest_selic.updated_at.replace(tzinfo=UTC).date() < datetime.now(UTC).date():
            logger.info("Macro indicators stale. Performing Brapi PRO daily indicators sync (background)...")
            t = asyncio.create_task(ingest_macro_indicators())
            _bg_tasks.add(t)
            t.add_done_callback(_bg_tasks.discard)

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

    # Prepare metadata
    updated_at_iso = None
    is_stale = True
    if latest_selic:
        updated_at_iso = latest_selic.updated_at.replace(tzinfo=UTC).isoformat() if latest_selic.updated_at else None
        is_stale = latest_selic.updated_at.replace(tzinfo=UTC).date() < datetime.now(UTC).date()

    return {
        "selic": indicators["selic"],
        "inflation": indicators["inflation"],
        "updatedAt": updated_at_iso,
        "isStale": is_stale,
    }


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
        
        # Paginate results in Python for non-DB items (small fixed sets)
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
        if latest_update is None:
            logger.info("Listings cache empty. Running initial Brapi PRO ingestion (blocking)...")
            await ingest_all_quotes()
        else:
            logger.info("Listings cache stale. Triggering background refresh...")
            t = asyncio.create_task(ingest_all_quotes())
            _bg_tasks.add(t)
            t.add_done_callback(_bg_tasks.discard)

    # Fast SQL-level search, sort, and pagination
    async with async_session_maker() as session:
        # Build query filtering out indexes
        query = select(AssetQuote).where(
            ~AssetQuote.ticker.like("^%"),
            ~AssetQuote.ticker.like("%=X")
        )
        if search:
            needle = f"%{search.upper().strip()}%"
            query = query.where(AssetQuote.ticker.ilike(needle) | AssetQuote.name.ilike(needle))

        # Apply sorting
        sort_col = None
        if sort_by == "name":
            sort_col = AssetQuote.name
        elif sort_by == "close":
            sort_col = AssetQuote.price
        elif sort_by == "change":
            sort_col = AssetQuote.change_percent
        elif sort_by == "change_abs":
            sort_col = func.abs(AssetQuote.change_percent)
        elif sort_by == "volume":
            sort_col = AssetQuote.volume
        elif sort_by == "market_cap_basic":
            sort_col = AssetQuote.market_cap
        elif sort_by == "sector":
            sort_col = AssetQuote.sector
        elif sort_by == "rank":
            sort_col = AssetQuote.ticker

        if sort_col is not None:
            if sort_order == "desc":
                query = query.order_by(desc(sort_col))
            else:
                query = query.order_by(sort_col)
        else:
            query = query.order_by(AssetQuote.name)

        # Count total matches
        count_query = select(func.count()).select_from(query.subquery())
        total_count = await session.scalar(count_query) or 0

        # Calculate pagination bounds
        page_size = max(1, min(limit, 100))
        total_pages = max(1, math.ceil(total_count / page_size))
        current_page = max(1, min(page, total_pages))
        start = (current_page - 1) * page_size

        # Fetch page records
        query = query.offset(start).limit(page_size)
        result = await session.execute(query)
        quotes = result.scalars().all()

    stocks = []
    for q in quotes:
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

    return {
        "stocks": stocks,
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

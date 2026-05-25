"""Database-backed market data querying and mapping service."""

import logging
from datetime import datetime, timezone
from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.market import AssetQuote, CurrencyQuote, MacroIndicator
from app.services.market_ingest import ingest_ticker_quote
from app.services.bcb_sgs import ingest_macro_indicators, ingest_ptax_dollar

logger = logging.getLogger(__name__)

INDEX_NAMES = {
    "^BVSP": "Ibovespa",
    "^GSPC": "S&P 500",
    "^VIX": "VIX",
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


async def get_db_quote(symbol: str) -> dict | None:
    """Retrieve quote from the Postgres cache, triggering live ingest on-the-fly if missing."""
    clean_ticker = _clean_symbol(symbol)
    app_ticker = _app_symbol(symbol)

    async with async_session_maker() as session:
        result = await session.execute(
            select(AssetQuote).where(AssetQuote.ticker == clean_ticker)
        )
        quote = result.scalar_one_or_none()

    # Self-populating cache fallback: fetch live if not found
    if not quote:
        logger.info(f"Quote for {clean_ticker} not found in database cache. Performing on-the-fly ingestion...")
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
    """Retrieve quotes for multiple symbols from cache."""
    results = []
    for symbol in symbols:
        quote = await get_db_quote(symbol)
        if quote:
            results.append(quote)
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
                    "updatedAtTimestamp": int(quote.updated_at.replace(tzinfo=timezone.utc).timestamp()),
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
        if not selic_check.scalar():
            logger.info("Macro indicators table empty. Performing BCB SGS daily indicators sync...")
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


"""Market data endpoints backed by PostgreSQL cache and Brapi PRO ingestion."""

import asyncio
import math
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, status

from app.services import bcb_sgs, market_db, market_ingest, news_ingest, yfinance_market

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quote/{symbol}")
async def quote(symbol: str) -> dict:
    """Get a single quote from cache, performing Brapi PRO ingestion if missing."""
    result = await market_db.get_db_quote(symbol)
    return result or {}


@router.post("/quotes")
async def quotes(payload: dict) -> dict:
    """Get quotes for multiple symbols through the backend market boundary."""
    symbols = payload.get("symbols") if isinstance(payload, dict) else []
    if not isinstance(symbols, list):
        symbols = []
    return await market_db.get_db_quotes([str(symbol) for symbol in symbols])


@router.get("/status")
async def status_endpoint() -> dict:
    """Get status of major indices (^BVSP, ^GSPC, ^VIX) from cache."""
    return await market_db.get_db_status()


@router.get("/radar/{symbol}")
async def radar(symbol: str) -> dict:
    """Get radar scores from yfinance, enriched with Brapi PRO fundamentals from the DB cache."""
    result = await asyncio.to_thread(yfinance_market.get_radar, symbol)
    db_quote = await market_db.get_db_quote(symbol)

    if not result:
        if not db_quote:
            return {}

        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "ticker": symbol.strip().upper(),
            "data": [],
            "profile": {
                "longBusinessSummary": db_quote.get("longBusinessSummary"),
                "sector": db_quote.get("sector"),
                "industry": db_quote.get("industry"),
                "website": db_quote.get("website"),
                "fullTimeEmployees": db_quote.get("fullTimeEmployees"),
            },
            "quote": {
                "regularMarketPrice": db_quote.get("regularMarketPrice", 0.0),
                "regularMarketChangePercent": db_quote.get("regularMarketChangePercent", 0.0),
                "fiftyTwoWeekHigh": db_quote.get("fiftyTwoWeekHigh", 0.0),
                "fiftyTwoWeekLow": db_quote.get("fiftyTwoWeekLow", 0.0),
                "marketCap": db_quote.get("marketCap"),
                "longName": db_quote.get("longName"),
            },
        }

    # yfinance often returns None for sector/industry/summary on B3 tickers.
    # Substitute with Brapi PRO data from the DB cache when available.
    if db_quote:
        existing_profile = result.get("profile") or {}
        result["profile"] = {
            "longBusinessSummary": db_quote.get("longBusinessSummary") or existing_profile.get("longBusinessSummary"),
            "sector": db_quote.get("sector") or existing_profile.get("sector"),
            "industry": db_quote.get("industry") or existing_profile.get("industry"),
            "website": db_quote.get("website") or existing_profile.get("website"),
            "fullTimeEmployees": db_quote.get("fullTimeEmployees") or existing_profile.get("fullTimeEmployees"),
        }
        if result.get("quote"):
            result["quote"]["marketCap"] = db_quote.get("marketCap") or result["quote"].get("marketCap")
            result["quote"]["longName"] = db_quote.get("longName") or result["quote"].get("longName")

    return result


@router.get("/listings")
async def listings(
    page: int = 1,
    limit: int = 20,
    sortBy: str = "name",
    sortOrder: str = "asc",
    type: str | None = None,
    search: str | None = None,
) -> dict:
    """Get listings from database cache with fast sorting, searching, and pagination."""
    return await market_db.get_db_listings(
        limit=limit,
        page=page,
        sort_by=sortBy,
        sort_order=sortOrder,
        item_type=type,
        search=search,
    )


@router.get("/treasury")
async def treasury_endpoint() -> dict:
    """Get dynamic list of all Treasury Bonds from Brapi with fallback to local static bonds."""
    from app.services.yfinance_market import fetch_live_treasury_bonds, TESOURO_BONDS, normalize_treasury_name_to_ticker
    
    live_bonds = fetch_live_treasury_bonds()
    results = []
    
    if live_bonds:
        for b in live_bonds:
            name = b.get("name", "")
            ticker = normalize_treasury_name_to_ticker(name)
            if ticker:
                results.append({
                    "symbol": ticker,
                    "name": name,
                    "buyPrice": b.get("buyPrice"),
                    "sellPrice": b.get("sellPrice"),
                    "buyRate": b.get("buyRate"),
                    "sellRate": b.get("sellRate"),
                    "maturityDate": b.get("maturityDate"),
                    "durationDays": b.get("durationDays"),
                    "indexer": TESOURO_BONDS[ticker]["indexer"],
                })
                
    if not results:
        for ticker, b in TESOURO_BONDS.items():
            results.append({
                "symbol": ticker,
                "name": b["name"],
                "buyPrice": b["price"],
                "sellPrice": b["price"] * 0.99,
                "buyRate": b["buyRate"],
                "sellRate": b["buyRate"] * 1.01,
                "maturityDate": b["maturity"],
                "durationDays": 1000,
                "indexer": b["indexer"],
            })
            
    return {"data": results}


@router.get("/search")
async def search(q: str, limit: int = 10, page: int = 1) -> dict:
    """Search assets: DB-first (full B3 universe by ticker and name), supplemented by yfinance."""
    seen: set[str] = set()
    results: list[dict] = []

    # 1. DB search — fast, offline-capable, searches both symbol and long name
    try:
        db_data = await market_db.get_db_listings(
            limit=limit * 3,
            page=1,
            sort_by="name",
            sort_order="asc",
            item_type=None,
            search=q,
        )
        for item in db_data.get("stocks", []):
            symbol = item.get("stock") or ""
            if not symbol or symbol in seen:
                continue
            seen.add(symbol)
            results.append({
                "symbol": symbol,
                "name": item.get("name") or symbol,
                "logo": None,
                "type": item.get("type") or "stock",
                "sector": item.get("sector"),
            })
    except Exception:
        pass

    # 2. yfinance supplement — catches US stocks, ETFs and anything not yet in the DB
    if len(results) < limit:
        try:
            yf_data = await asyncio.to_thread(
                yfinance_market.search_assets, q, limit - len(results), page
            )
            for item in yf_data.get("results", []):
                sym = item.get("symbol") or ""
                if sym and sym not in seen:
                    results.append(item)
                    seen.add(sym)
        except Exception:
            pass

    total_count = len(results)
    page_size = max(1, limit)
    total_pages = max(1, math.ceil(total_count / page_size))
    current_page = max(1, min(page, total_pages))
    start = (current_page - 1) * page_size
    return {
        "results": results[start : start + page_size],
        "currentPage": current_page,
        "totalPages": total_pages,
        "itemsPerPage": page_size,
        "totalCount": total_count,
        "hasNextPage": current_page < total_pages,
    }


def _normalize_title(value: str) -> str:
    return " ".join((value or "").lower().split())


@router.get("/news/{symbol}")
async def news(symbol: str, count: int = 3) -> list[dict]:
    """Get news feed for a ticker, served from the Postgres cache (RSS-backed) plus yfinance.

    The DB is the primary source; yfinance fills the long tail for international tickers
    and ADRs that don't surface in Brazilian RSS feeds.
    """
    db_task = market_db.get_db_news(symbol, count=max(count, 6))
    yf_task = asyncio.to_thread(yfinance_market.get_news, symbol, max(count, 6))
    db_items, yf_items = await asyncio.gather(db_task, yf_task)

    seen_links: set[str] = set()
    seen_titles: set[str] = set()
    merged: list[dict] = []

    for source in (db_items, yf_items):
        for item in source:
            link = (item.get("link") or "").strip()
            title_key = _normalize_title(item.get("title") or "")
            if not link or link in seen_links:
                continue
            if title_key and title_key in seen_titles:
                continue
            seen_links.add(link)
            if title_key:
                seen_titles.add(title_key)
            merged.append(item)

    merged.sort(key=lambda item: item.get("publishedAt") or 0, reverse=True)
    return merged[:count]


@router.get("/news")
async def latest_news(count: int = 12) -> list[dict]:
    """Get the latest pt-BR financial news from the Postgres cache (RSS-backed)."""
    return await market_db.get_db_latest_news(count=count)


@router.post("/sync/news", status_code=status.HTTP_202_ACCEPTED)
async def sync_news(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger background ingestion of pt-BR RSS news feeds into Postgres."""
    background_tasks.add_task(news_ingest.ingest_brazilian_news)
    return {"message": "Brazilian news ingestion started in background."}


@router.get("/currency")
async def currency(pairs: str = "USD-BRL,EUR-BRL,GBP-BRL") -> dict:
    """Get currency exchange rates from database cache."""
    pair_list = [pair.strip() for pair in pairs.split(",") if pair.strip()]
    return await market_db.get_db_currencies(pair_list)


@router.get("/indicators")
async def indicators() -> dict:
    """Get latest macro indicators (SELIC, IPCA) from database cache."""
    return await market_db.get_db_indicators()


@router.get("/history")
async def history(tickers: str, range: str = "1mo") -> dict:
    """Get historical OHLCV from cache, self-populating through Brapi PRO when missing."""
    symbol_list = [ticker.strip() for ticker in tickers.split(",") if ticker.strip()]
    return await market_db.get_db_history(symbol_list, range)


# ─── BACKGROUND DATA SYNC ENDPOINTS ───────────────────────────────────────────

@router.post("/sync/quotes", status_code=status.HTTP_202_ACCEPTED)
async def sync_quotes(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger background ingestion of real-time quotes for the entire B3 universe."""
    background_tasks.add_task(market_ingest.ingest_all_quotes)
    return {"message": "Batch quotes ingestion started in background."}


@router.post("/sync/macro", status_code=status.HTTP_202_ACCEPTED)
async def sync_macro(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger background ingestion of Brapi macro indicators and exchange rates with SGS fallback."""
    background_tasks.add_task(bcb_sgs.ingest_macro_indicators)
    background_tasks.add_task(bcb_sgs.ingest_ptax_dollar)
    return {"message": "Brapi PRO macro/currency ingestion started in background with BCB SGS fallback."}


@router.post("/sync/history", status_code=status.HTTP_202_ACCEPTED)
async def sync_history(background_tasks: BackgroundTasks, period: str = "3y") -> dict[str, str]:
    """Trigger background ingestion of Brapi PRO historical OHLCV."""
    background_tasks.add_task(market_ingest.ingest_all_histories, period)
    return {"message": f"Historical prices ingestion ({period}) started in background."}

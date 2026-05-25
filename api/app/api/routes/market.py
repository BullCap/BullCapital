"""Market data endpoints backed by PostgreSQL cache (Brapi + BCB SGS) and yfinance fallback."""

import asyncio
from typing import Annotated

from fastapi import APIRouter, Query, BackgroundTasks, status

from app.services import market_db, market_ingest, bcb_sgs, yfinance_market

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quote/{symbol}")
async def quote(symbol: str) -> dict:
    """Get single quote from the database cache, performing on-the-fly fetch if missing."""
    result = await market_db.get_db_quote(symbol)
    return result or {}


@router.post("/quotes")
async def quotes(payload: dict) -> dict:
    """Get quotes for multiple symbols from cache."""
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
    """Get radar scores. Runs in thread pool with yfinance/database fallback."""
    result = await asyncio.to_thread(yfinance_market.get_radar, symbol)
    return result or {}


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


@router.get("/search")
async def search(q: str, limit: int = 10, page: int = 1) -> dict:
    """Search assets. Fallback to B3 universe search."""
    return await asyncio.to_thread(yfinance_market.search_assets, q, limit, page)


@router.get("/news/{symbol}")
async def news(symbol: str, count: int = 3) -> list[dict]:
    """Get news feed with headlines translated to Brazilian Portuguese."""
    return await asyncio.to_thread(yfinance_market.get_news, symbol, count)


@router.get("/currency")
async def currency(pairs: str = "USD-BRL,EUR-BRL,GBP-BRL") -> dict:
    """Get currency exchange rates from database cache."""
    pair_list = [pair.strip() for pair in pairs.split(",") if pair.strip()]
    return await market_db.get_db_currencies(pair_list)


@router.get("/indicators")
async def indicators() -> dict:
    """Get latest macro indicators (SELIC, IPCA) from database cache."""
    return await market_db.get_db_indicators()


# ─── BACKGROUND DATA SYNC ENDPOINTS ───────────────────────────────────────────

@router.post("/sync/quotes", status_code=status.HTTP_202_ACCEPTED)
async def sync_quotes(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger background ingestion of real-time quotes for the entire B3 universe."""
    background_tasks.add_task(market_ingest.ingest_all_quotes)
    return {"message": "Batch quotes ingestion started in background."}


@router.post("/sync/macro", status_code=status.HTTP_202_ACCEPTED)
async def sync_macro(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger background ingestion of BCB SGS macro indicators and exchange rates."""
    background_tasks.add_task(bcb_sgs.ingest_macro_indicators)
    background_tasks.add_task(bcb_sgs.ingest_ptax_dollar)
    return {"message": "BCB SGS macro indicators and PTAX exchange rate ingestion started in background."}


@router.post("/sync/history", status_code=status.HTTP_202_ACCEPTED)
async def sync_history(background_tasks: BackgroundTasks, period: str = "3y") -> dict[str, str]:
    """Trigger background ingestion of historical prices for Markovitz calculations."""
    background_tasks.add_task(market_ingest.ingest_all_histories, period)
    return {"message": f"Historical prices ingestion ({period}) started in background."}

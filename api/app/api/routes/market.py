"""Market data endpoints backed by yfinance."""

import asyncio
from typing import Annotated

from fastapi import APIRouter, Query

from app.services import yfinance_market

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quote/{symbol}")
async def quote(symbol: str) -> dict:
    result = await asyncio.to_thread(yfinance_market.get_quote, symbol)
    return result or {}


@router.post("/quotes")
async def quotes(payload: dict) -> dict:
    symbols = payload.get("symbols") if isinstance(payload, dict) else []
    if not isinstance(symbols, list):
        symbols = []
    return await asyncio.to_thread(yfinance_market.get_quotes, [str(symbol) for symbol in symbols])


@router.get("/status")
async def status() -> dict:
    return await asyncio.to_thread(yfinance_market.get_status)


@router.get("/radar/{symbol}")
async def radar(symbol: str) -> dict:
    result = await asyncio.to_thread(yfinance_market.get_radar, symbol)
    return result or {}


@router.get("/history")
async def history(
    tickers: Annotated[str, Query(min_length=1)],
    range: str = "1mo",
) -> dict:
    symbols = [ticker.strip() for ticker in tickers.split(",") if ticker.strip()]
    return await asyncio.to_thread(yfinance_market.get_history, symbols, range)


@router.get("/listings")
async def listings(
    page: int = 1,
    limit: int = 20,
    sortBy: str = "name",
    sortOrder: str = "asc",
    type: str | None = None,
    search: str | None = None,
) -> dict:
    return await asyncio.to_thread(
        yfinance_market.get_listings,
        limit,
        page,
        sortBy,
        sortOrder,
        type,
        search,
    )


@router.get("/search")
async def search(q: str, limit: int = 10, page: int = 1) -> dict:
    return await asyncio.to_thread(yfinance_market.search_assets, q, limit, page)


@router.get("/news/{symbol}")
async def news(symbol: str, count: int = 3) -> list[dict]:
    return await asyncio.to_thread(yfinance_market.get_news, symbol, count)


@router.get("/currency")
async def currency(pairs: str = "USD-BRL,EUR-BRL,GBP-BRL") -> dict:
    pair_list = [pair.strip() for pair in pairs.split(",") if pair.strip()]
    return await asyncio.to_thread(yfinance_market.get_currencies, pair_list)

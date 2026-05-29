"""Market data endpoints backed by PostgreSQL cache and Brapi PRO ingestion."""

import asyncio
import math
from collections.abc import Awaitable
from datetime import UTC, datetime
from typing import TypeVar

from fastapi import APIRouter, BackgroundTasks, Query, status
from pydantic import BaseModel, Field, field_validator

from app.services import bcb_sgs, market_db, market_ingest, news_ingest, yfinance_market

router = APIRouter(prefix="/market", tags=["market"])
T = TypeVar("T")

MAX_QUOTE_SYMBOLS = 50
MAX_HISTORY_SYMBOLS = 8
MAX_NEWS_COUNT = 24

HOME_TREEMAP_TICKERS = [
    "VALE3",
    "PETR4",
    "ITUB4",
    "PETR3",
    "AXIA3",
    "BBDC4",
    "SBSP3",
    "B3SA3",
    "ITSA4",
    "ABEV3",
    "BPAC11",
    "WEGE3",
    "BBAS3",
    "PRIO3",
    "GGBR4",
    "EMBJ3",
    "EQTL3",
    "ENEVE3",
    "CPLE3",
    "RENT3",
    "VBBR3",
    "RDOR3",
    "UGPA3",
]

TERMINAL_DEFAULT_TICKERS = ["PETR4", "VALE3", "ITUB4", "BBAS3", "TAEE11", "MXRF11"]


class QuotesPayload(BaseModel):
    symbols: list[str] = Field(default_factory=list, max_length=MAX_QUOTE_SYMBOLS)

    @field_validator("symbols")
    @classmethod
    def normalize_symbols(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        normalized: list[str] = []
        for raw_symbol in value:
            symbol = str(raw_symbol).strip()
            if not symbol:
                continue
            key = symbol.upper()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(symbol)
        return normalized


@router.get("/quote/{symbol}")
async def quote(symbol: str) -> dict:
    """Get a single quote from cache, performing Brapi PRO ingestion if missing."""
    result = await market_db.get_db_quote(symbol)
    return result or {}


@router.post("/quotes")
async def quotes(payload: QuotesPayload) -> dict:
    """Get quotes for multiple symbols through the backend market boundary."""
    return await market_db.get_db_quotes(payload.symbols)


@router.get("/status")
async def status_endpoint() -> dict:
    """Get status of major indices (^BVSP, ^GSPC, ^VIX) from cache."""
    return await market_db.get_db_status()


@router.get("/radar/{symbol}")
async def radar(symbol: str) -> dict:
    """Get radar scores from yfinance, enriched with Brapi PRO fundamentals from the DB cache."""
    radar_result, db_quote_result = await asyncio.gather(
        asyncio.to_thread(yfinance_market.get_radar, symbol),
        market_db.get_db_quote(symbol),
        return_exceptions=True,
    )
    result = None if isinstance(radar_result, Exception) else radar_result
    db_quote = None if isinstance(db_quote_result, Exception) else db_quote_result

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
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
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


async def _safe(coro: Awaitable[T], fallback: T) -> T:
    try:
        return await coro
    except Exception:
        return fallback


@router.get("/snapshot/pulse")
async def pulse_snapshot() -> dict[str, object]:
    """Aggregated market pulse for top-of-page cards and daily brief context."""
    quotes_task = _safe(market_db.get_db_quotes(["^BVSP", "^GSPC", "^VIX"]), {"results": []})
    history_task = _safe(market_db.get_db_history(["^BVSP", "^GSPC"], "1mo"), {"results": []})
    indicators_task = _safe(market_db.get_db_indicators(), {"selic": [], "inflation": []})
    currency_task = _safe(market_db.get_db_currencies(["USD-BRL"]), {"currencies": []})
    quotes, history, indicators, currency = await asyncio.gather(
        quotes_task,
        history_task,
        indicators_task,
        currency_task,
    )
    return {
        "quotes": quotes,
        "history": history,
        "indicators": indicators,
        "currency": currency,
        "updatedAt": datetime.now(UTC).isoformat(),
    }


@router.get("/snapshot/home-highlights")
async def home_highlights_snapshot() -> dict[str, object]:
    """Aggregated home highlights, alternative assets, and treemap quote data."""
    gainers_task = _safe(
        market_db.get_db_listings(limit=6, sort_by="change", sort_order="desc", item_type="stock"),
        {"stocks": []},
    )
    losers_task = _safe(
        market_db.get_db_listings(limit=6, sort_by="change", sort_order="asc", item_type="stock"),
        {"stocks": []},
    )
    volume_task = _safe(
        market_db.get_db_listings(limit=6, sort_by="volume", sort_order="desc", item_type="stock"),
        {"stocks": []},
    )
    crypto_task = _safe(market_db.get_db_listings(limit=6, item_type="crypto"), {"stocks": []})
    fixed_income_task = _safe(market_db.get_db_listings(limit=6, item_type="fixed_income"), {"stocks": []})
    treemap_task = _safe(market_db.get_db_quotes(HOME_TREEMAP_TICKERS), {"results": []})
    gainers, losers, most_traded, crypto, fixed_income, treemap_quotes = await asyncio.gather(
        gainers_task,
        losers_task,
        volume_task,
        crypto_task,
        fixed_income_task,
        treemap_task,
    )
    return {
        "gainers": gainers,
        "losers": losers,
        "mostTraded": most_traded,
        "crypto": crypto,
        "fixedIncome": fixed_income,
        "treemapQuotes": treemap_quotes,
        "updatedAt": datetime.now(UTC).isoformat(),
    }


@router.get("/snapshot/landing")
async def landing_snapshot() -> dict[str, object]:
    """Aggregated public landing data so the hero can stream separately from market data."""
    top_assets_task = _safe(
        market_db.get_db_listings(limit=25, sort_by="market_cap_basic", sort_order="desc", item_type="stock"),
        {"stocks": []},
    )
    gainers_task = _safe(
        market_db.get_db_listings(limit=5, sort_by="change", sort_order="desc", item_type="stock"),
        {"stocks": []},
    )
    losers_task = _safe(
        market_db.get_db_listings(limit=5, sort_by="change", sort_order="asc", item_type="stock"),
        {"stocks": []},
    )
    volume_task = _safe(
        market_db.get_db_listings(limit=5, sort_by="volume", sort_order="desc", item_type="stock"),
        {"stocks": []},
    )
    pulse_task = _safe(market_db.get_db_quotes(["^BVSP", "^VIX"]), {"results": []})
    currency_task = _safe(market_db.get_db_currencies(["USD-BRL"]), {"currencies": []})
    top_assets, gainers, losers, most_traded, pulse_quotes, currency = await asyncio.gather(
        top_assets_task,
        gainers_task,
        losers_task,
        volume_task,
        pulse_task,
        currency_task,
    )
    return {
        "topAssets": top_assets,
        "gainers": gainers,
        "losers": losers,
        "mostTraded": most_traded,
        "quotes": pulse_quotes,
        "currency": currency,
        "updatedAt": datetime.now(UTC).isoformat(),
    }


@router.get("/snapshot/terminal")
async def terminal_snapshot() -> dict[str, object]:
    """Aggregated bootstrap payload for the Terminal workspace."""
    quotes_task = _safe(market_db.get_db_quotes(TERMINAL_DEFAULT_TICKERS), {"results": []})
    status_task = _safe(market_db.get_db_status(), {"indices": []})
    currency_task = _safe(market_db.get_db_currencies(["USD-BRL"]), {"currencies": []})
    quotes, market_status, currency = await asyncio.gather(quotes_task, status_task, currency_task)
    return {
        "quotes": quotes,
        "marketStatus": market_status,
        "currency": currency,
        "updatedAt": datetime.now(UTC).isoformat(),
    }


@router.get("/treasury")
async def treasury_endpoint() -> dict:
    """Get dynamic list of all Treasury Bonds from Brapi with fallback to local static bonds."""
    from app.services.yfinance_market import (
        TESOURO_BONDS,
        fetch_live_treasury_bonds,
        normalize_treasury_name_to_ticker,
    )

    live_bonds = await asyncio.to_thread(fetch_live_treasury_bonds)
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
async def search(
    q: str = Query(min_length=1, max_length=64),
    limit: int = Query(default=10, ge=1, le=25),
    page: int = Query(default=1, ge=1),
) -> dict:
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
async def news(symbol: str, count: int = Query(default=3, ge=1, le=MAX_NEWS_COUNT)) -> list[dict]:
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
async def latest_news(count: int = Query(default=12, ge=1, le=MAX_NEWS_COUNT)) -> list[dict]:
    """Get the latest pt-BR financial news from the Postgres cache (RSS-backed)."""
    return await market_db.get_db_latest_news(count=count)


@router.post("/sync/news", status_code=status.HTTP_202_ACCEPTED)
async def sync_news(background_tasks: BackgroundTasks) -> dict[str, str]:
    """Trigger background ingestion of pt-BR RSS news feeds into Postgres."""
    background_tasks.add_task(news_ingest.ingest_brazilian_news)
    return {"message": "Brazilian news ingestion started in background."}


@router.get("/currency")
async def currency(pairs: str = Query(default="USD-BRL,EUR-BRL,GBP-BRL", max_length=128)) -> dict:
    """Get currency exchange rates from database cache."""
    pair_list = [pair.strip() for pair in pairs.split(",") if pair.strip()]
    return await market_db.get_db_currencies(pair_list)


@router.get("/indicators")
async def indicators() -> dict:
    """Get latest macro indicators (SELIC, IPCA) from database cache."""
    return await market_db.get_db_indicators()


@router.get("/history")
async def history(
    tickers: str = Query(min_length=1, max_length=256),
    range: str = Query(default="1mo", max_length=8),
) -> dict:
    """Get historical OHLCV from cache, self-populating through Brapi PRO when missing."""
    symbol_list = [ticker.strip() for ticker in tickers.split(",") if ticker.strip()]
    symbol_list = symbol_list[:MAX_HISTORY_SYMBOLS]
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

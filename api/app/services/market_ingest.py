"""Market data ingestion service utilizing Brapi PRO (primary) and yfinance (secondary/backfill)."""

import asyncio
import logging
import math
from datetime import datetime, date
import httpx
import yfinance as yf
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.market import AssetQuote, AssetHistoricalPrice
from app.services.yfinance_market import B3_UNIVERSE

logger = logging.getLogger(__name__)

BRAPI_QUOTE_URL = "https://brapi.dev/api/quote/{ticker}"
TIMEOUT_SECONDS = 15


def _to_float(v) -> float | None:
    """Safely convert any value to float, filtering out inf and nan."""
    if v is None:
        return None
    try:
        val = float(v)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    except (ValueError, TypeError):
        return None


async def fetch_brapi_quote(ticker: str) -> dict | None:
    """Fetch quote and fundamentals from Brapi for a single ticker."""
    if not settings.brapi_key:
        logger.warning("Brapi API key not configured. Skipping Brapi fetch.")
        return None

    # Clean ticker (Brapi expects clean tickers for B3, no .SA)
    clean_ticker = ticker.strip().upper()
    if clean_ticker.endswith(".SA"):
        clean_ticker = clean_ticker[:-3]

    url = BRAPI_QUOTE_URL.format(ticker=clean_ticker)
    params = {
        "token": settings.brapi_key,
        "fundamental": "true",
    }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url, params=params)
            if response.status_code == 404:
                logger.warning(f"Ticker {clean_ticker} not found on Brapi.")
                return None
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])
            if not results:
                return None
            return results[0]
        except Exception as e:
            logger.error(f"Error calling Brapi for ticker {clean_ticker}: {e}")
            return None


async def fetch_brapi_quotes_batch(tickers: list[str]) -> list[dict]:
    """Fetch quotes and multiples in batch from Brapi PRO (supports up to 20 assets per call)."""
    if not settings.brapi_key:
        logger.warning("Brapi API key not configured. Skipping Brapi batch fetch.")
        return []

    clean_tickers = []
    for t in tickers:
        clean = t.strip().upper()
        if clean.endswith(".SA"):
            clean = clean[:-3]
        clean_tickers.append(clean)

    tickers_str = ",".join(clean_tickers)
    url = BRAPI_QUOTE_URL.format(ticker=tickers_str)
    params = {
        "token": settings.brapi_key,
        "fundamental": "true",
    }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except Exception as e:
            logger.error(f"Error calling Brapi batch for tickers {tickers_str}: {e}")
            return []


def _get_yf_ticker_info(ticker_name: str) -> dict | None:
    """Synchronous yfinance fetching executed in a thread pool."""
    symbol = ticker_name.strip().upper()
    if not symbol.startswith("^") and not symbol.endswith("=X") and "." not in symbol:
        symbol = f"{symbol}.SA"

    try:
        yf_ticker = yf.Ticker(symbol)
        info = yf_ticker.info
        if not info or "regularMarketPrice" not in info:
            # Try history fallback
            hist = yf_ticker.history(period="5d")
            if not hist.empty:
                last_row = hist.dropna(subset=["Close"]).tail(1)
                prev_row = hist.dropna(subset=["Close"]).tail(2).head(1)
                close = float(last_row["Close"].iloc[0])
                prev_close = float(prev_row["Close"].iloc[0]) if not prev_row.empty else close
                change = ((close - prev_close) / prev_close * 100) if prev_close > 0 else 0.0
                volume = float(last_row["Volume"].iloc[0]) if "Volume" in last_row else 0.0
                return {
                    "symbol": ticker_name,
                    "longName": ticker_name,
                    "regularMarketPrice": close,
                    "regularMarketChangePercent": change,
                    "regularMarketVolume": volume,
                }
            return None

        return {
            "symbol": ticker_name,
            "shortName": info.get("shortName"),
            "longName": info.get("longName") or info.get("shortName") or ticker_name,
            "regularMarketPrice": info.get("regularMarketPrice") or info.get("currentPrice"),
            "regularMarketChangePercent": info.get("regularMarketChangePercent") or 0.0,
            "regularMarketVolume": info.get("regularMarketVolume") or info.get("volume") or 0.0,
            "marketCap": info.get("marketCap"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
            "priceEarnings": info.get("trailingPE"),
            "dividendYield": info.get("trailingAnnualDividendYield") or info.get("dividendYield"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "longBusinessSummary": info.get("longBusinessSummary"),
        }
    except Exception as e:
        logger.error(f"Error calling yfinance for symbol {symbol}: {e}")
        return None


async def fetch_yfinance_quote(ticker: str) -> dict | None:
    """Fetch quote and fundamentals from yfinance as secondary backfill."""
    return await asyncio.to_thread(_get_yf_ticker_info, ticker)


async def upsert_quote_record(quote_data: dict, ticker: str) -> bool:
    """Insert or update a quote record in the PostgreSQL cache, casting advanced fundamentals."""
    try:
        ticker_upper = ticker.strip().upper()
        price = _to_float(quote_data.get("regularMarketPrice")) or 0.0
        change_pct = _to_float(quote_data.get("regularMarketChangePercent")) or 0.0
        volume = _to_float(quote_data.get("regularMarketVolume")) or 0.0

        pe = _to_float(quote_data.get("priceEarnings") or quote_data.get("pe"))
        dy = _to_float(quote_data.get("dividendYield") or quote_data.get("dy"))
        # Normalize Dividend Yield to percent standard
        if dy is not None and dy > 0.0 and dy < 1.0:
            dy = dy * 100.0

        # Advanced B2B fundamentals from Brapi PRO
        p_vp = _to_float(quote_data.get("priceToBook") or quote_data.get("p_vp"))
        roe = _to_float(quote_data.get("roe") or quote_data.get("returnOnEquity"))
        roic = _to_float(quote_data.get("roic") or quote_data.get("returnOnInvestedCapital"))
        ev_ebitda = _to_float(quote_data.get("enterpriseValueEbitda") or quote_data.get("evEbitda"))

        async with async_session_maker() as session:
            stmt = insert(AssetQuote).values(
                ticker=ticker_upper,
                name=quote_data.get("longName") or quote_data.get("shortName") or ticker,
                price=price,
                change_percent=change_pct,
                volume=volume,
                market_cap=_to_float(quote_data.get("marketCap")),
                high_52w=_to_float(quote_data.get("fiftyTwoWeekHigh")),
                low_52w=_to_float(quote_data.get("fiftyTwoWeekLow")),
                pe_ratio=pe,
                dividend_yield=dy,
                ev_ebitda=ev_ebitda,
                roe=roe,
                roic=roic,
                p_vp=p_vp,
                sector=quote_data.get("sector"),
                industry=quote_data.get("industry"),
                business_summary=quote_data.get("longBusinessSummary") or quote_data.get("businessSummary"),
            )
            # Upsert on conflict
            stmt = stmt.on_conflict_do_update(
                constraint="asset_quotes_pkey",
                set_={
                    "name": stmt.excluded.name,
                    "price": stmt.excluded.price,
                    "change_percent": stmt.excluded.change_percent,
                    "volume": stmt.excluded.volume,
                    "market_cap": stmt.excluded.market_cap,
                    "high_52w": stmt.excluded.high_52w,
                    "low_52w": stmt.excluded.low_52w,
                    "pe_ratio": stmt.excluded.pe_ratio,
                    "dividend_yield": stmt.excluded.dividend_yield,
                    "ev_ebitda": stmt.excluded.ev_ebitda,
                    "roe": stmt.excluded.roe,
                    "roic": stmt.excluded.roic,
                    "p_vp": stmt.excluded.p_vp,
                    "sector": stmt.excluded.sector,
                    "industry": stmt.excluded.industry,
                    "business_summary": stmt.excluded.business_summary,
                    "updated_at": func.now(),
                },
            )
            await session.execute(stmt)
            await session.commit()
            logger.info(f"Successfully upserted cache for {ticker_upper} (Price: R$ {price:.2f})")
            return True
    except Exception as e:
        logger.error(f"Failed to upsert quote in db for {ticker}: {e}")
        return False


async def ingest_ticker_quote(ticker: str) -> bool:
    """Fetch and upsert single quote (called on-the-fly for custom tickers)."""
    quote_data = await fetch_brapi_quote(ticker)
    if not quote_data:
        quote_data = await fetch_yfinance_quote(ticker)

    if not quote_data:
        return False

    return await upsert_quote_record(quote_data, ticker)


async def ingest_all_quotes() -> int:
    """Ingest quotes for all assets in B3_UNIVERSE and indices.

    Leverages Brapi PRO batching capability to fetch in chunks of 20 assets per call,
    bringing synchronization time to under 1 second.
    """
    logger.info("Starting batch quotes ingestion (Brapi PRO Batching Mode)...")
    tickers = list(B3_UNIVERSE)
    tickers.extend(["^BVSP", "^GSPC", "^VIX"])

    # Chunk list into lists of up to 20 items
    chunk_size = 20
    chunks = [tickers[i : i + chunk_size] for i in range(0, len(tickers), chunk_size)]

    success_count = 0
    for chunk in chunks:
        logger.info(f"Fetching batch chunk of {len(chunk)} tickers...")
        results = []
        if settings.brapi_key:
            results = await fetch_brapi_quotes_batch(chunk)

        # Fallback to individual yfinance fetching for tickers that failed or if Brapi key missing
        fetched_tickers = {r.get("symbol", "").strip().upper() for r in results}
        for ticker in chunk:
            clean = ticker.strip().upper()
            if clean.endswith(".SA"):
                clean = clean[:-3]

            # Find result in batch
            quote_data = next((r for r in results if r.get("symbol", "").strip().upper() == clean), None)

            if quote_data:
                success = await upsert_quote_record(quote_data, ticker)
                if success:
                    success_count += 1
            else:
                # Perform yfinance backfill
                logger.info(f"Ticker {ticker} missing from batch. Running yfinance fallback...")
                quote_data = await fetch_yfinance_quote(ticker)
                if quote_data:
                    success = await upsert_quote_record(quote_data, ticker)
                    if success:
                        success_count += 1

        # Tiny pause between batch requests (100ms) to respect rate limits gently
        await asyncio.sleep(0.1)

    logger.info(f"Quotes ingestion complete. Successfully processed {success_count}/{len(tickers)} assets.")
    return success_count


def _download_yf_history(symbol: str, period: str) -> list[dict]:
    """Download daily closes synchronously from yfinance."""
    ticker_symbol = symbol.strip().upper()
    if not ticker_symbol.startswith("^") and not ticker_symbol.endswith("=X") and "." not in ticker_symbol:
        ticker_symbol = f"{ticker_symbol}.SA"

    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=period, interval="1d")
        if df.empty:
            return []

        history_records = []
        for index, row in df.iterrows():
            close = float(row.get("Close") or 0.0)
            volume = float(row.get("Volume") or 0.0)
            if close <= 0:
                continue

            history_records.append({
                "date": index.date(),
                "close": close,
                "volume": volume,
            })
        return history_records
    except Exception as e:
        logger.error(f"Error calling yfinance history for {ticker_symbol}: {e}")
        return []


async def ingest_asset_history(ticker: str, period: str = "3y") -> int:
    """Fetch daily closing history from yfinance and upsert it into the database."""
    logger.info(f"Ingesting daily historical prices for {ticker} (Period: {period})...")
    records = await asyncio.to_thread(_download_yf_history, ticker, period)

    if not records:
        logger.warning(f"No history found for {ticker}")
        return 0

    inserted = 0
    async with async_session_maker() as session:
        for record in records:
            try:
                stmt = insert(AssetHistoricalPrice).values(
                    ticker=ticker.strip().upper(),
                    date=record["date"],
                    close=record["close"],
                    volume=record["volume"],
                )
                stmt = stmt.on_conflict_do_update(
                    constraint="uq_ticker_date",
                    set_={
                        "close": record["close"],
                        "volume": record["volume"],
                    },
                )
                await session.execute(stmt)
                inserted += 1
            except Exception as e:
                logger.error(f"Failed to upsert history row for {ticker} on date {record['date']}: {e}")

        await session.commit()
    logger.info(f"Upserted {inserted} historical daily price rows for {ticker}")
    return inserted


async def ingest_all_histories(period: str = "3y") -> int:
    """Download daily history for the entire B3 universe to populate the Markovitz engine database."""
    logger.info("Starting historical prices ingestion for all universe assets...")
    tickers = list(B3_UNIVERSE)
    tickers.extend(["^BVSP", "^GSPC"])

    total_assets = 0
    for ticker in tickers:
        count = await ingest_asset_history(ticker, period)
        if count > 0:
            total_assets += 1
        await asyncio.sleep(0.5)

    logger.info(f"Historical prices ingestion complete. Processed {total_assets}/{len(tickers)} assets.")
    return total_assets

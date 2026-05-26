"""Market data ingestion service utilizing Brapi PRO (primary) and yfinance (secondary/backfill)."""

import asyncio
import logging
import math
from datetime import UTC, datetime

import httpx
import yfinance as yf
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.market import AssetHistoricalPrice, AssetQuote
from app.services.yfinance_market import B3_UNIVERSE

logger = logging.getLogger(__name__)

BRAPI_QUOTE_URL = "https://brapi.dev/api/quote/{ticker}"
TIMEOUT_SECONDS = 15
BRAPI_QUOTE_MODULES = "summaryProfile,defaultKeyStatistics,financialData"
VALID_BRAPI_RANGES = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}
BRAPI_RANGE_ALIASES = {
    "3y": "5y",
    "15y": "max",
    "16y": "max",
    "all": "max",
}


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


def _brapi_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.brapi_key}"} if settings.brapi_key else {}


def _clean_ticker(ticker: str) -> str:
    clean_ticker = ticker.strip().upper()
    if clean_ticker.endswith(".SA"):
        return clean_ticker[:-3]
    return clean_ticker


def _normalize_range(range_name: str) -> str:
    requested = (range_name or "1mo").strip().lower()
    requested = BRAPI_RANGE_ALIASES.get(requested, requested)
    return requested if requested in VALID_BRAPI_RANGES else "1mo"


def _normalize_yf_period(period: str) -> str:
    requested = (period or "1mo").strip().lower()
    return BRAPI_RANGE_ALIASES.get(requested, requested)


def _nested_dict(data: dict, key: str) -> dict:
    value = data.get(key)
    return value if isinstance(value, dict) else {}


async def fetch_brapi_quote(ticker: str) -> dict | None:
    """Fetch quote and fundamentals from Brapi for a single ticker."""
    if not settings.brapi_key:
        logger.warning("Brapi API key not configured. Skipping Brapi fetch.")
        return None

    # Brapi expects clean B3 tickers, without the Yahoo ".SA" suffix.
    clean_ticker = _clean_ticker(ticker)

    url = BRAPI_QUOTE_URL.format(ticker=clean_ticker)
    params = {
        "fundamental": "true",
        "dividends": "true",
        "modules": BRAPI_QUOTE_MODULES,
    }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url, params=params, headers=_brapi_headers())
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
        clean_tickers.append(_clean_ticker(t))

    tickers_str = ",".join(clean_tickers)
    url = BRAPI_QUOTE_URL.format(ticker=tickers_str)
    params = {
        "fundamental": "true",
        "dividends": "true",
        "modules": BRAPI_QUOTE_MODULES,
    }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url, params=params, headers=_brapi_headers())
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except Exception as e:
            logger.error(f"Error calling Brapi batch for tickers {tickers_str}: {e}")
            return []


async def fetch_brapi_history(ticker: str, range_name: str = "1mo") -> list[dict]:
    """Fetch daily OHLCV history from Brapi PRO using the quote historicalDataPrice payload."""
    if not settings.brapi_key:
        logger.warning("Brapi API key not configured. Skipping Brapi history fetch.")
        return []

    clean_ticker = _clean_ticker(ticker)
    url = BRAPI_QUOTE_URL.format(ticker=clean_ticker)
    params = {
        "range": _normalize_range(range_name),
        "interval": "1d",
    }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url, params=params, headers=_brapi_headers())
            response.raise_for_status()
            results = response.json().get("results", [])
            if not results:
                return []

            history = results[0].get("historicalDataPrice") or []
            records: list[dict] = []
            for row in history:
                if not isinstance(row, dict):
                    continue

                raw_date = row.get("date")
                if raw_date is None:
                    continue
                try:
                    record_date = datetime.fromtimestamp(int(raw_date), tz=UTC).date()
                except (TypeError, ValueError, OSError):
                    continue

                close = _to_float(row.get("close") or row.get("adjustedClose"))
                if close is None or close <= 0:
                    continue

                records.append({
                    "date": record_date,
                    "open": _to_float(row.get("open")),
                    "high": _to_float(row.get("high")),
                    "low": _to_float(row.get("low")),
                    "close": close,
                    "volume": _to_float(row.get("volume")),
                })
            return records
        except Exception as e:
            logger.error(f"Error calling Brapi history for ticker {clean_ticker}: {e}")
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
        summary_profile = _nested_dict(quote_data, "summaryProfile")
        key_stats = _nested_dict(quote_data, "defaultKeyStatistics")
        financial_data = _nested_dict(quote_data, "financialData")
        price = _to_float(quote_data.get("regularMarketPrice")) or 0.0
        change_pct = _to_float(quote_data.get("regularMarketChangePercent")) or 0.0
        volume = _to_float(quote_data.get("regularMarketVolume")) or 0.0

        pe = _to_float(
            quote_data.get("priceEarnings")
            or quote_data.get("pe")
            or key_stats.get("trailingPE")
            or key_stats.get("forwardPE")
        )
        dy = _to_float(
            quote_data.get("dividendYield")
            or quote_data.get("dy")
            or key_stats.get("dividendYield")
            or key_stats.get("trailingAnnualDividendYield")
        )
        # Normalize Dividend Yield to percent standard
        if dy is not None and dy > 0.0 and dy < 1.0:
            dy = dy * 100.0

        # Advanced B2B fundamentals from Brapi PRO
        p_vp = _to_float(quote_data.get("priceToBook") or quote_data.get("p_vp") or key_stats.get("priceToBook"))
        roe = _to_float(quote_data.get("roe") or quote_data.get("returnOnEquity") or financial_data.get("returnOnEquity"))
        roic = _to_float(
            quote_data.get("roic")
            or quote_data.get("returnOnInvestedCapital")
            or financial_data.get("returnOnInvestedCapital")
        )
        ev_ebitda = _to_float(
            quote_data.get("enterpriseValueEbitda")
            or quote_data.get("evEbitda")
            or key_stats.get("enterpriseToEbitda")
            or financial_data.get("enterpriseToEbitda")
        )

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
                sector=quote_data.get("sector") or summary_profile.get("sector") or summary_profile.get("sectorDisp"),
                industry=quote_data.get("industry") or summary_profile.get("industry") or summary_profile.get("industryDisp"),
                business_summary=(
                    quote_data.get("longBusinessSummary")
                    or quote_data.get("businessSummary")
                    or summary_profile.get("longBusinessSummary")
                ),
            )
            # Upsert on conflict
            stmt = stmt.on_conflict_do_update(
                constraint="asset_quotes_pkey",
                set_={
                    "name": stmt.excluded.name,
                    "price": stmt.excluded.price,
                    "change_percent": stmt.excluded.change_percent,
                    "volume": stmt.excluded.volume,
                    # Price-adjacent fields: keep existing value when incoming is null
                    "market_cap": func.coalesce(stmt.excluded.market_cap, AssetQuote.__table__.c.market_cap),
                    "high_52w": func.coalesce(stmt.excluded.high_52w, AssetQuote.__table__.c.high_52w),
                    "low_52w": func.coalesce(stmt.excluded.low_52w, AssetQuote.__table__.c.low_52w),
                    # Fundamentals: never wipe a previously-populated value with null.
                    # Brapi batch calls update price every 5 min but may not re-send module
                    # data (defaultKeyStatistics, financialData) on every request.
                    "pe_ratio": func.coalesce(stmt.excluded.pe_ratio, AssetQuote.__table__.c.pe_ratio),
                    "dividend_yield": func.coalesce(stmt.excluded.dividend_yield, AssetQuote.__table__.c.dividend_yield),
                    "ev_ebitda": func.coalesce(stmt.excluded.ev_ebitda, AssetQuote.__table__.c.ev_ebitda),
                    "roe": func.coalesce(stmt.excluded.roe, AssetQuote.__table__.c.roe),
                    "roic": func.coalesce(stmt.excluded.roic, AssetQuote.__table__.c.roic),
                    "p_vp": func.coalesce(stmt.excluded.p_vp, AssetQuote.__table__.c.p_vp),
                    "sector": func.coalesce(stmt.excluded.sector, AssetQuote.__table__.c.sector),
                    "industry": func.coalesce(stmt.excluded.industry, AssetQuote.__table__.c.industry),
                    "business_summary": func.coalesce(stmt.excluded.business_summary, AssetQuote.__table__.c.business_summary),
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
        for ticker in chunk:
            clean = _clean_ticker(ticker)

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
    """Download daily OHLCV synchronously from yfinance as a fallback."""
    ticker_symbol = symbol.strip().upper()
    if not ticker_symbol.startswith("^") and not ticker_symbol.endswith("=X") and "." not in ticker_symbol:
        ticker_symbol = f"{ticker_symbol}.SA"

    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=_normalize_yf_period(period), interval="1d")
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
                "open": _to_float(row.get("Open")),
                "high": _to_float(row.get("High")),
                "low": _to_float(row.get("Low")),
                "close": close,
                "volume": volume,
            })
        return history_records
    except Exception as e:
        logger.error(f"Error calling yfinance history for {ticker_symbol}: {e}")
        return []


async def ingest_asset_history(ticker: str, period: str = "3y") -> int:
    """Fetch daily OHLCV history from Brapi PRO and upsert it into the database."""
    logger.info(f"Ingesting daily OHLCV prices for {ticker} (Period: {period})...")
    records = await fetch_brapi_history(ticker, period)
    if not records:
        logger.info(f"Brapi history missing for {ticker}. Running yfinance fallback...")
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
                    open=record.get("open"),
                    high=record.get("high"),
                    low=record.get("low"),
                    close=record["close"],
                    volume=record["volume"],
                )
                stmt = stmt.on_conflict_do_update(
                    constraint="uq_ticker_date",
                    set_={
                        "open": func.coalesce(record.get("open"), AssetHistoricalPrice.__table__.c.open),
                        "high": func.coalesce(record.get("high"), AssetHistoricalPrice.__table__.c.high),
                        "low": func.coalesce(record.get("low"), AssetHistoricalPrice.__table__.c.low),
                        "close": record["close"],
                        "volume": func.coalesce(record.get("volume"), AssetHistoricalPrice.__table__.c.volume),
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

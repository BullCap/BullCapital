"""Banco Central do Brasil (BCB) SGS API client and ingestion service."""

import logging
from datetime import datetime, timedelta
import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.database import async_session_maker
from app.models.market import CurrencyQuote, MacroIndicator

logger = logging.getLogger(__name__)

BCB_SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series_id}/dados"
TIMEOUT_SECONDS = 15

# Series IDs from BCB SGS
SERIES_MAP = {
    432: "SELIC",        # Target Selic rate (% a.a.)
    12: "CDI",          # Daily CDI rate (% a.a.)
    13522: "IPCA",      # IPCA accumulated over the last 12 months (% a.a.)
    1: "USD-BRL-PTAX",  # PTAX Dollar buy rate
}


async def fetch_sgs_series(series_id: int, lookback_days: int = 30) -> list[dict]:
    """Fetch series data from BCB SGS API for the given lookback period."""
    today = datetime.now()
    start_date = today - timedelta(days=lookback_days)

    # Format dates as DD/MM/YYYY for BCB
    fmt = "%d/%m/%Y"
    params = {
        "formato": "json",
        "dataInicial": start_date.strftime(fmt),
        "dataFinal": today.strftime(fmt),
    }

    url = BCB_SGS_URL.format(series_id=series_id)

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                logger.warning(f"Unexpected response format from BCB SGS for series {series_id}")
                return []
            return data
        except Exception as e:
            logger.error(f"Error fetching series {series_id} from BCB SGS: {e}")
            return []


async def ingest_macro_indicators(lookback_days: int = 45) -> bool:
    """Ingest SELIC, CDI, and IPCA indicators from BCB SGS into the database."""
    logger.info("Starting ingestion of macroeconomic indicators from BCB SGS...")
    success = True

    # Ingest Macro indicators (SELIC: 432, CDI: 12, IPCA: 13522)
    macro_series = [432, 12, 13522]

    async with async_session_maker() as session:
        for series_id in macro_series:
            series_name = SERIES_MAP[series_id]
            logger.info(f"Ingesting series {series_name} (ID: {series_id})...")
            rows = await fetch_sgs_series(series_id, lookback_days)

            if not rows:
                success = False
                continue

            records_inserted = 0
            for row in rows:
                try:
                    # Parse date (DD/MM/YYYY)
                    record_date = datetime.strptime(row["data"], "%d/%m/%Y").date()
                    # Parse value (e.g. "10,75" -> 10.75)
                    value = float(row["valor"].replace(",", "."))

                    # PostgreSQL upsert (ON CONFLICT DO UPDATE)
                    stmt = insert(MacroIndicator).values(
                        series_id=series_id,
                        name=series_name,
                        date=record_date,
                        value=value,
                    )
                    # Update value on conflict
                    stmt = stmt.on_conflict_do_update(
                        constraint="uq_series_date",
                        set_={"value": value},
                    )
                    await session.execute(stmt)
                    records_inserted += 1
                except Exception as e:
                    logger.error(f"Failed to parse row {row} for series {series_id}: {e}")
                    success = False

            await session.commit()
            logger.info(f"Successfully processed {records_inserted} entries for {series_name}")

    return success


async def ingest_ptax_dollar(lookback_days: int = 15) -> bool:
    """Ingest the latest PTAX dollar exchange rate from BCB SGS into the database."""
    logger.info("Starting ingestion of PTAX Dollar exchange rate from BCB SGS...")

    # PTAX Dollar buy rate series
    series_id = 1
    rows = await fetch_sgs_series(series_id, lookback_days)

    if not rows:
        return False

    latest = rows[-1]
    try:
        # Parse date (DD/MM/YYYY)
        record_date = datetime.strptime(latest["data"], "%d/%m/%Y")
        # Parse price
        price = float(latest["valor"].replace(",", "."))

        async with async_session_maker() as session:
            # Upsert into currency_quotes table
            stmt = insert(CurrencyQuote).values(
                pair="USD-BRL",
                name="USD/BRL",
                bid=price,
                ask=price,
                high=price,
                low=price,
                updated_at=record_date,
            )
            # Update values on primary key conflict
            stmt = stmt.on_conflict_do_update(
                constraint="currency_quotes_pkey",
                set_={
                    "bid": price,
                    "ask": price,
                    "high": price,
                    "low": price,
                    "updated_at": record_date,
                },
            )
            await session.execute(stmt)
            await session.commit()
            logger.info(f"Successfully updated PTAX dollar exchange rate to R$ {price:.4f} (Date: {record_date.date()})")
            return True
    except Exception as e:
        logger.error(f"Failed to parse PTAX dollar data: {e}")
        return False

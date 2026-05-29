"""Macroeconomic and currency ingestion with Brapi PRO as primary source."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

import httpx
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.market import CurrencyQuote, MacroIndicator

logger = logging.getLogger(__name__)

BCB_SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series_id}/dados"
BRAPI_MACRO_URL = "https://brapi.dev/api/v2/macro/latest"
BRAPI_CURRENCY_URL = "https://brapi.dev/api/v2/currency"
TIMEOUT_SECONDS = 15

# Series IDs from BCB SGS
SERIES_MAP = {
    432: "SELIC",        # Target Selic rate (% a.a.)
    12: "CDI",          # Daily CDI rate (% a.a.)
    13522: "IPCA",      # IPCA accumulated over the last 12 months (% a.a.)
    1: "USD-BRL-PTAX",  # PTAX Dollar buy rate
}
BRAPI_MACRO_SERIES = {
    "selic": (432, "SELIC"),
    "selicovernight": (1178, "SELIC OVER"),
    "cdi": (12, "CDI"),
    "tr": (226, "TR"),
    "ipca": (433, "IPCA MENSAL"),
    "ipca12m": (13522, "IPCA"),
    "inpc": (188, "INPC"),
    "igpm": (189, "IGP-M"),
    "igpdi": (190, "IGP-DI"),
    "ibcbr": (24363, "IBC-BR"),
    "pibmensal": (4380, "PIB MENSAL"),
    "desemprego": (24369, "DESEMPREGO"),
    "m1": (27788, "M1"),
    "m4": (27810, "M4"),
    "reservas": (3546, "RESERVAS"),
}


def _parse_brapi_date(value: Any) -> datetime | None:
    if not value:
        return None
    text = str(value)
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def _iter_brapi_macro_points(payload: Any) -> list[tuple[int, str, datetime, float]]:
    """Normalize Brapi macro response variants into DB-ready records."""
    container = payload.get("results") or payload.get("data") or payload if isinstance(payload, dict) else payload
    if isinstance(container, dict):
        items = []
        for key, value in container.items():
            if isinstance(value, list):
                items.append({"symbol": key, "data": value})
            elif isinstance(value, dict):
                items.append({"symbol": value.get("symbol") or key, **value})
    elif isinstance(container, list):
        items = container
    else:
        items = []

    records: list[tuple[int, str, datetime, float]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        raw_series_meta = item.get("series")
        series_meta: dict[str, Any] = raw_series_meta if isinstance(raw_series_meta, dict) else {}
        symbol = str(
            item.get("symbol")
            or series_meta.get("slug")
            or item.get("name")
            or series_meta.get("name")
            or item.get("ticker")
            or ""
        ).lower()
        series = BRAPI_MACRO_SERIES.get(symbol)
        points = item.get("data") or item.get("values") or item.get("historicalDataPrice")
        if isinstance(item.get("latest"), dict):
            points = [item["latest"]]
        if not isinstance(points, list):
            points = [item]
        if not series:
            for key in BRAPI_MACRO_SERIES:
                if key in symbol:
                    series = BRAPI_MACRO_SERIES[key]
                    break
        if not series:
            continue
        series_id, series_name = series
        for point in points:
            if not isinstance(point, dict):
                continue
            point_date = _parse_brapi_date(point.get("date") or point.get("data") or point.get("updatedAt"))
            value = _parse_number(point.get("value") or point.get("valor") or point.get("rate") or point.get("close"))
            if point_date and value is not None:
                records.append((series_id, series_name, point_date, value))
    return records


async def fetch_brapi_macro_indicators() -> list[tuple[int, str, datetime, float]]:
    """Fetch macro indicators from Brapi PRO as the primary source."""
    if not settings.brapi_key:
        return []

    params = {"symbols": ",".join(BRAPI_MACRO_SERIES.keys())}
    headers = {"Authorization": f"Bearer {settings.brapi_key}"}

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            response = await client.get(BRAPI_MACRO_URL, params=params, headers=headers)
            response.raise_for_status()
            return _iter_brapi_macro_points(response.json())
        except Exception as e:
            logger.warning(f"Brapi macro fetch failed; BCB SGS fallback will be used: {e}")
            return []


async def upsert_macro_records(records: list[tuple[int, str, datetime, float]]) -> bool:
    if not records:
        return False

    try:
        async with async_session_maker() as session:
            stmt = insert(MacroIndicator).values([
                {
                    "id": str(uuid4()),
                    "series_id": series_id,
                    "name": series_name,
                    "date": record_date.date(),
                    "value": value,
                }
                for series_id, series_name, record_date, value in records
            ])
            stmt = stmt.on_conflict_do_update(
                constraint="uq_series_date",
                set_={"value": stmt.excluded.value, "updated_at": func.now()},
            )
            await session.execute(stmt)
            await session.commit()
        logger.info(f"Successfully processed {len(records)} macro indicator entries")
        return True
    except Exception as e:
        logger.error(f"Failed to batch upsert macro records: {e}")
        return False


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
    """Ingest SELIC, CDI, and IPCA from Brapi PRO, with BCB SGS as automatic fallback."""
    logger.info("Starting ingestion of macroeconomic indicators from Brapi PRO...")
    brapi_records = await fetch_brapi_macro_indicators()
    if await upsert_macro_records(brapi_records):
        return True

    logger.info("Starting ingestion of macroeconomic indicators from BCB SGS fallback...")

    # Ingest Macro indicators (SELIC: 432, CDI: 12, IPCA: 13522)
    macro_series = [432, 12, 13522]

    series_rows = await asyncio.gather(
        *(fetch_sgs_series(series_id, lookback_days) for series_id in macro_series),
        return_exceptions=True,
    )

    bcb_records: list[tuple[int, str, datetime, float]] = []
    success = True
    for series_id, rows_result in zip(macro_series, series_rows):
        series_name = SERIES_MAP[series_id]
        if isinstance(rows_result, Exception):
            logger.error(f"Failed to fetch series {series_id} from BCB SGS: {rows_result}")
            success = False
            continue
        if not rows_result:
            success = False
            continue
        for row in rows_result:
            try:
                record_date = datetime.strptime(row["data"], "%d/%m/%Y")
                value = float(row["valor"].replace(",", "."))
                bcb_records.append((series_id, series_name, record_date, value))
            except Exception as e:
                logger.error(f"Failed to parse row {row} for series {series_id}: {e}")
                success = False

    if bcb_records:
        result = await upsert_macro_records(bcb_records)
        if not result:
            success = False

    return success


async def ingest_ptax_dollar(lookback_days: int = 15) -> bool:
    """Ingest USD/BRL from Brapi PRO currency endpoint, with BCB SGS PTAX fallback."""
    if settings.brapi_key:
        params = {"currency": "USD-BRL", "token": settings.brapi_key}
        headers = {"Authorization": f"Bearer {settings.brapi_key}"}
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            try:
                response = await client.get(BRAPI_CURRENCY_URL, params=params, headers=headers)
                response.raise_for_status()
                payload = response.json()
                if isinstance(payload, dict):
                    rows = payload.get("currency") or payload.get("results") or payload.get("data") or []
                else:
                    rows = payload
                if isinstance(rows, dict):
                    rows = [rows]
                latest = next((row for row in rows if isinstance(row, dict)), None)
                bid = _parse_number(latest.get("bidPrice") or latest.get("bid") or latest.get("price")) if latest else None
                ask = _parse_number(latest.get("askPrice") or latest.get("ask") or latest.get("price")) if latest else None
                high = _parse_number(latest.get("highPrice") or latest.get("high") or bid) if latest else None
                low = _parse_number(latest.get("lowPrice") or latest.get("low") or bid) if latest else None
                updated_at = _parse_brapi_date(latest.get("updatedAt") or latest.get("date")) if latest else None
                if latest and bid is not None:
                    async with async_session_maker() as session:
                        stmt = insert(CurrencyQuote).values(
                            pair="USD-BRL",
                            name="USD/BRL",
                            bid=bid,
                            ask=ask or bid,
                            high=high or bid,
                            low=low or bid,
                            updated_at=updated_at or datetime.now(),
                        )
                        stmt = stmt.on_conflict_do_update(
                            constraint="currency_quotes_pkey",
                            set_={
                                "bid": bid,
                                "ask": ask or bid,
                                "high": high or bid,
                                "low": low or bid,
                                "updated_at": updated_at or datetime.now(),
                            },
                        )
                        await session.execute(stmt)
                        await session.commit()
                    logger.info(f"Successfully updated USD/BRL from Brapi to R$ {bid:.4f}")
                    return True
            except Exception as e:
                logger.warning(f"Brapi currency fetch failed; BCB SGS fallback will be used: {e}")

    logger.info("Starting ingestion of PTAX Dollar exchange rate from BCB SGS fallback...")

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

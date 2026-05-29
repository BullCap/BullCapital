"""Tests for aggregated market snapshot endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.api.routes import market


async def fake_quotes(symbols: list[str]) -> dict[str, object]:
    return {"results": [{"symbol": symbol, "regularMarketPrice": 100.0} for symbol in symbols]}


async def fake_history(symbols: list[str], range_name: str = "1mo") -> dict[str, object]:
    return {
        "results": [
            {
                "symbol": symbol,
                "range": range_name,
                "history": [{"timestamp": 1_717_000_000, "close": 100.0}],
            }
            for symbol in symbols
        ]
    }


async def fake_indicators() -> dict[str, object]:
    return {"selic": [{"date": "2026-05-29", "value": 10.5}], "inflation": []}


async def fake_currencies(pairs: list[str]) -> dict[str, object]:
    return {"currencies": [{"name": pair, "bidPrice": 5.1, "lowPrice": 5.0} for pair in pairs]}


async def fake_status() -> dict[str, object]:
    return {"indices": [{"symbol": "^BVSP", "regularMarketPrice": 125000.0}]}


async def fake_listings(
    limit: int = 20,
    page: int = 1,
    sort_by: str = "name",
    sort_order: str = "asc",
    item_type: str | None = None,
    search: str | None = None,
) -> dict[str, object]:
    ticker = f"{item_type or sort_by}-{sort_order}".upper().replace("_", "")
    return {
        "stocks": [
            {
                "stock": ticker,
                "name": search or ticker,
                "close": 10.0,
                "change": 1.2,
                "volume": limit * 1000,
                "marketCap": None,
                "logo": None,
                "sector": None,
                "type": item_type or "stock",
            }
        ],
        "indexes": [],
        "currentPage": page,
        "totalPages": 1,
        "totalCount": 1,
        "hasNextPage": False,
    }


@pytest.mark.parametrize(
    ("path", "expected_keys"),
    [
        ("/api/v1/market/snapshot/pulse", {"quotes", "history", "indicators", "currency"}),
        (
            "/api/v1/market/snapshot/home-highlights",
            {"gainers", "losers", "mostTraded", "crypto", "fixedIncome", "treemapQuotes"},
        ),
        ("/api/v1/market/snapshot/landing", {"topAssets", "gainers", "losers", "mostTraded", "quotes", "currency"}),
        ("/api/v1/market/snapshot/terminal", {"quotes", "marketStatus", "currency"}),
    ],
)
def test_market_snapshot_endpoints_return_aggregated_payload(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    path: str,
    expected_keys: set[str],
) -> None:
    """Snapshot endpoints expose stable payloads for server-rendered pages."""
    monkeypatch.setattr(market.market_db, "get_db_quotes", fake_quotes)
    monkeypatch.setattr(market.market_db, "get_db_history", fake_history)
    monkeypatch.setattr(market.market_db, "get_db_indicators", fake_indicators)
    monkeypatch.setattr(market.market_db, "get_db_currencies", fake_currencies)
    monkeypatch.setattr(market.market_db, "get_db_status", fake_status)
    monkeypatch.setattr(market.market_db, "get_db_listings", fake_listings)

    response = client.get(path)

    assert response.status_code == 200
    data = response.json()
    assert expected_keys.issubset(data.keys())
    assert "updatedAt" in data


def test_market_pulse_snapshot_uses_fallback_for_partial_failures(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A failed child read should not block the page-level market pulse."""

    async def failing_history(_symbols: list[str], _range_name: str = "1mo") -> dict[str, object]:
        raise RuntimeError("history cache unavailable")

    monkeypatch.setattr(market.market_db, "get_db_quotes", fake_quotes)
    monkeypatch.setattr(market.market_db, "get_db_history", failing_history)
    monkeypatch.setattr(market.market_db, "get_db_indicators", fake_indicators)
    monkeypatch.setattr(market.market_db, "get_db_currencies", fake_currencies)

    response = client.get("/api/v1/market/snapshot/pulse")

    assert response.status_code == 200
    data = response.json()
    assert data["quotes"]["results"][0]["symbol"] == "^BVSP"
    assert data["history"] == {"results": []}

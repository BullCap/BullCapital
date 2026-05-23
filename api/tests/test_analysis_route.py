"""Tests for analysis route response handling."""

from fastapi.testclient import TestClient

from app.agent.market_analysis import market_analysis_agent


def test_analysis_falls_back_when_model_response_is_unstructured(
    client: TestClient,
    monkeypatch,
) -> None:
    """The UI should receive a renderable local analysis when the model fails."""

    async def fake_run(_message: str, _context: dict | None = None) -> str:
        return "sem payload estruturado"

    monkeypatch.setattr(market_analysis_agent, "run", fake_run)

    response = client.post(
        "/api/v1/analysis",
        json={"subject": "PETR4", "context": {"price": 44.48}},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["summary"]
    assert data["sections"]["o_que_aconteceu"]
    assert data["artifacts"]

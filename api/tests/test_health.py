"""Tests for health check endpoint."""

from fastapi.testclient import TestClient

from app.core.config import settings


def test_health_check(client: TestClient) -> None:
    """Test that health check returns healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-service"


def test_root_endpoint(client: TestClient) -> None:
    """Test that root endpoint returns service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "BullCapital" in data["message"]
    assert "version" in data


def test_internal_token_required_for_private_api(client: TestClient, monkeypatch) -> None:
    """Private API endpoints require the server-to-server token when configured."""
    monkeypatch.setattr(settings, "api_shared_secret", "test-secret")

    response = client.get("/api/v1/market/status")

    assert response.status_code == 401
    assert response.json()["detail"] == "Não autorizado"


def test_health_check_remains_public_with_internal_token(client: TestClient, monkeypatch) -> None:
    """Railway health checks must remain public even when API protection is enabled."""
    monkeypatch.setattr(settings, "api_shared_secret", "test-secret")

    response = client.get("/api/v1/health")

    assert response.status_code == 200

"""Tests for API settings."""

from app.core.config import Settings


def test_settings_ignore_generic_debug_environment(monkeypatch) -> None:
    """A frontend DEBUG value should not keep the API from starting."""
    monkeypatch.setenv("DEBUG", "release")
    monkeypatch.delenv("APP_DEBUG", raising=False)

    assert Settings().debug is False


def test_settings_accept_app_debug_environment(monkeypatch) -> None:
    """API debug remains configurable with a service-specific setting."""
    monkeypatch.setenv("APP_DEBUG", "true")

    assert Settings().debug is True

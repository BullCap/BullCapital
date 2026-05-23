"""Tests for yfinance news translation helpers."""

from collections.abc import Iterator

import pytest

from app.services import yfinance_market


@pytest.fixture(autouse=True)
def clear_news_translation_cache() -> Iterator[None]:
    """Keep cached translations from leaking between tests."""
    yfinance_market._translate_news_title.cache_clear()
    yield
    yfinance_market._translate_news_title.cache_clear()


def test_translate_news_title_returns_original_without_provider_key(monkeypatch) -> None:
    """News should still render when no translation provider is configured."""
    monkeypatch.setattr(yfinance_market.settings, "openrouter_api_key", "")
    monkeypatch.setattr(yfinance_market.settings, "openai_api_key", "")

    assert yfinance_market._translate_news_title("Stocks rise after Fed decision") == (
        "Stocks rise after Fed decision"
    )


def test_translate_news_title_uses_openrouter_first(monkeypatch) -> None:
    """OpenRouter matches the existing low-cost news AI path in the app."""
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(yfinance_market.settings, "openrouter_api_key", "openrouter-key")
    monkeypatch.setattr(yfinance_market.settings, "openrouter_model", "router-model")
    monkeypatch.setattr(yfinance_market.settings, "openai_api_key", "openai-key")

    def fake_request_news_translation(**kwargs: object) -> str:
        calls.append(kwargs)
        return "Acoes sobem apos decisao do Fed"

    monkeypatch.setattr(yfinance_market, "_request_news_translation", fake_request_news_translation)

    assert yfinance_market._translate_news_title("Stocks rise after Fed decision") == (
        "Acoes sobem apos decisao do Fed"
    )
    assert calls == [
        {
            "api_url": yfinance_market.OPENROUTER_CHAT_COMPLETIONS_URL,
            "api_key": "openrouter-key",
            "model": "router-model",
            "title": "Stocks rise after Fed decision",
            "extra_headers": {
                "HTTP-Referer": "https://bullcapital.app",
                "X-Title": "BullCapital",
            },
        }
    ]


def test_translate_news_title_falls_back_to_openai(monkeypatch) -> None:
    """OpenAI is used when OpenRouter is not configured."""
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(yfinance_market.settings, "openrouter_api_key", "")
    monkeypatch.setattr(yfinance_market.settings, "openai_api_key", "openai-key")
    monkeypatch.setattr(yfinance_market.settings, "openai_model", "openai-model")

    def fake_request_news_translation(**kwargs: object) -> str:
        calls.append(kwargs)
        return "Petrobras avanca com petroleo em alta"

    monkeypatch.setattr(yfinance_market, "_request_news_translation", fake_request_news_translation)

    assert yfinance_market._translate_news_title("Petrobras gains as oil rises") == (
        "Petrobras avanca com petroleo em alta"
    )
    assert calls == [
        {
            "api_url": yfinance_market.OPENAI_CHAT_COMPLETIONS_URL,
            "api_key": "openai-key",
            "model": "openai-model",
            "title": "Petrobras gains as oil rises",
        }
    ]

"""Tests for news image extraction in yfinance_market service."""

from unittest.mock import MagicMock
from app.services import yfinance_market

def test_get_news_extracts_image_url(monkeypatch) -> None:
    """get_news should correctly parse yfinance content.thumbnail and return it in imageUrl."""
    mock_ticker_instance = MagicMock()
    # Mocking Ticker news data
    mock_ticker_instance.news = [
        {
            "title": "Mock News Title",
            "link": "https://example.com/news",
            "publisher": "Mock Publisher",
            "providerPublishTime": 1700000000,
            "content": {
                "title": "Mock News Title",
                "canonicalUrl": {"url": "https://example.com/news"},
                "provider": {"displayName": "Mock Publisher"},
                "pubDate": "2026-05-23T17:00:00Z",
                "thumbnail": {
                    "originalUrl": "https://example.com/image.jpg",
                    "resolutions": [
                        {"url": "https://example.com/image_170.jpg", "width": 170, "height": 128}
                    ]
                }
            }
        }
    ]

    # Monkeypatch yf.Ticker to return our mock instance
    monkeypatch.setattr(yfinance_market.yf, "Ticker", lambda symbol: mock_ticker_instance)
    # Avoid translating mock titles to speed up/prevent actual network calls
    monkeypatch.setattr(yfinance_market, "_translate_news_title", lambda title: title)

    news = yfinance_market.get_news("PETR4")
    assert len(news) == 1
    assert news[0]["title"] == "Mock News Title"
    assert news[0]["imageUrl"] == "https://example.com/image.jpg"


def test_get_news_extracts_image_url_fallback(monkeypatch) -> None:
    """get_news should fall back to thumbnail resolutions if originalUrl is missing."""
    mock_ticker_instance = MagicMock()
    mock_ticker_instance.news = [
        {
            "title": "Mock News Title 2",
            "link": "https://example.com/news2",
            "publisher": "Mock Publisher",
            "providerPublishTime": 1700000000,
            "content": {
                "title": "Mock News Title 2",
                "thumbnail": {
                    "resolutions": [
                        {"url": "https://example.com/image_fallback.jpg", "width": 170, "height": 128}
                    ]
                }
            }
        }
    ]

    monkeypatch.setattr(yfinance_market.yf, "Ticker", lambda symbol: mock_ticker_instance)
    monkeypatch.setattr(yfinance_market, "_translate_news_title", lambda title: title)

    news = yfinance_market.get_news("PETR4")
    assert len(news) == 1
    assert news[0]["imageUrl"] == "https://example.com/image_fallback.jpg"

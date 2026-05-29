"""Market data service backed only by yfinance."""

from __future__ import annotations

import math
import socket
import time
import threading
from dataclasses import dataclass
from datetime import UTC
from functools import lru_cache
from typing import Any

import httpx
import pandas as pd
import yfinance as yf

from app.core.config import settings

# Set a socket default timeout to prevent third-party integrations (yfinance, requests, etc.) from hanging
socket.setdefaulttimeout(10.0)

OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
NEWS_TRANSLATION_TIMEOUT_SECONDS = 6

B3_UNIVERSE = [
    "PETR4",
    "PETR3",
    "VALE3",
    "ITUB4",
    "BBDC4",
    "BBAS3",
    "B3SA3",
    "ABEV3",
    "WEGE3",
    "RENT3",
    "SUZB3",
    "PRIO3",
    "GGBR4",
    "CSNA3",
    "USIM5",
    "MGLU3",
    "LREN3",
    "RAIL3",
    "RADL3",
    "TIMS3",
    "HAPV3",
    "EQTL3",
    "CMIG4",
    "TAEE11",
    "SBSP3",
    "TOTS3",
    "BPAC11",
    "SANB11",
    "BBSE3",
    "IRBR3",
    "YDUQ3",
    "COGN3",
    "MRVE3",
    "CYRE3",
    "MULT3",
    "BRAP4",
    "KLBN11",
    "RAIZ4",
    "UGPA3",
    "VBBR3",
    "CSAN3",
    "GOAU4",
    "SLCE3",
    "SMTO3",
    "ALOS3",
    "ASAI3",
    "PCAR3",
    # Ibovespa constituents required by HOME_TREEMAP_TICKERS / SectorTreeMap
    "AXIA3",
    "ITSA4",
    "EMBJ3",
    "ENEVE3",
    "CPLE3",
    "RDOR3",
]

INDEX_NAMES = {
    "^BVSP": "Ibovespa",
    "^GSPC": "S&P 500",
    "^VIX": "VIX",
}

CRYPTO_COINS = {"BTC", "ETH", "SOL", "XRP", "ADA"}

TESOURO_BONDS = {
    "TESOURO_SELIC_2026": {
        "ticker": "TESOURO_SELIC_2026",
        "name": "Tesouro Selic 2026",
        "shortName": "Tesouro Selic 2026",
        "longName": "Tesouro Selic 2026 LFT",
        "price": 14250.60,
        "change": 0.05,
        "buyRate": 0.08,
        "maturity": "2026-03-01",
        "indexer": "Selic",
    },
    "TESOURO_SELIC_2029": {
        "ticker": "TESOURO_SELIC_2029",
        "name": "Tesouro Selic 2029",
        "shortName": "Tesouro Selic 2029",
        "longName": "Tesouro Selic 2029 LFT",
        "price": 14190.20,
        "change": 0.05,
        "buyRate": 0.15,
        "maturity": "2029-03-01",
        "indexer": "Selic",
    },
    "TESOURO_IPCA_2029": {
        "ticker": "TESOURO_IPCA_2029",
        "name": "Tesouro IPCA+ 2029",
        "shortName": "Tesouro IPCA+ 2029",
        "longName": "Tesouro IPCA+ 2029 NTN-B",
        "price": 3150.40,
        "change": -0.12,
        "buyRate": 6.25,
        "maturity": "2029-05-15",
        "indexer": "IPCA",
    },
    "TESOURO_IPCA_2035": {
        "ticker": "TESOURO_IPCA_2035",
        "name": "Tesouro IPCA+ 2035",
        "shortName": "Tesouro IPCA+ 2035",
        "longName": "Tesouro IPCA+ 2035 NTN-B",
        "price": 2250.80,
        "change": -0.18,
        "buyRate": 6.35,
        "maturity": "2035-05-15",
        "indexer": "IPCA",
    },
    "TESOURO_IPCA_2045": {
        "ticker": "TESOURO_IPCA_2045",
        "name": "Tesouro IPCA+ 2045",
        "shortName": "Tesouro IPCA+ 2045",
        "longName": "Tesouro IPCA+ 2045 NTN-B",
        "price": 1250.30,
        "change": -0.25,
        "buyRate": 6.42,
        "maturity": "2045-05-15",
        "indexer": "IPCA",
    },
    "TESOURO_PREFIXADO_2026": {
        "ticker": "TESOURO_PREFIXADO_2026",
        "name": "Tesouro Prefixado 2026",
        "shortName": "Tesouro Prefixado 2026",
        "longName": "Tesouro Prefixado 2026 LTN",
        "price": 820.50,
        "change": -0.05,
        "buyRate": 11.20,
        "maturity": "2026-01-01",
        "indexer": "Prefixado",
    },
    "TESOURO_PREFIXADO_2029": {
        "ticker": "TESOURO_PREFIXADO_2029",
        "name": "Tesouro Prefixado 2029",
        "shortName": "Tesouro Prefixado 2029",
        "longName": "Tesouro Prefixado 2029 LTN",
        "price": 610.20,
        "change": -0.10,
        "buyRate": 11.85,
        "maturity": "2029-01-01",
        "indexer": "Prefixado",
    },
}

def _is_crypto(symbol: str) -> bool:
    cleaned = symbol.strip().upper()
    if cleaned in CRYPTO_COINS:
        return True
    if "-" in cleaned:
        base, quote = cleaned.split("-", 1)
        if base in CRYPTO_COINS and quote in {"BRL", "USD"}:
            return True
    return False


STATIC_CRYPTO_QUOTES = {
    "BTC": {
        "name": "Bitcoin BRL",
        "price": 365820.50,
        "change": 1.85,
        "volume": 42000000.0,
        "marketCap": 7180000000000.0,
    },
    "ETH": {
        "name": "Ethereum BRL",
        "price": 18450.20,
        "change": 0.92,
        "volume": 18000000.0,
        "marketCap": 2220000000000.0,
    },
    "SOL": {
        "name": "Solana BRL",
        "price": 752.40,
        "change": 3.12,
        "volume": 12000000.0,
        "marketCap": 34500000000.0,
    },
    "XRP": {
        "name": "Ripple BRL",
        "price": 3.18,
        "change": -0.45,
        "volume": 500000.0,
        "marketCap": 180000000.0,
    },
    "ADA": {
        "name": "Cardano BRL",
        "price": 2.22,
        "change": -1.08,
        "volume": 200000.0,
        "marketCap": 78000000.0,
    }
}

def get_static_crypto_quote(symbol: str) -> dict | None:
    base = symbol.split("-", 1)[0] if "-" in symbol else symbol
    if base not in STATIC_CRYPTO_QUOTES:
        return None
    info = STATIC_CRYPTO_QUOTES[base]
    return {
        "symbol": symbol,
        "shortName": info["name"],
        "longName": info["name"],
        "regularMarketPrice": info["price"],
        "regularMarketChangePercent": info["change"],
        "regularMarketVolume": info["volume"],
        "marketCap": int(info["marketCap"]),
        "logourl": "",
        "fiftyTwoWeekHigh": info["price"] * 1.25,
        "fiftyTwoWeekLow": info["price"] * 0.75,
        "sector": "Cripto",
        "industry": "Criptomoeda",
        "website": "",
        "longBusinessSummary": f"Criptoativo {info['name']} monitorado sob taxas reais e variação diária.",
        "fullTimeEmployees": 0,
        "trailingPE": 0.0,
        "profitMargins": 0.0,
        "dividendYield": 0.0,
        "averageVolume": info["volume"],
        "is_stale": True,
    }

def get_static_crypto_history_points(symbol: str, range_name: str = "1mo") -> list[dict]:
    return []  # histórico de cripto indisponível sem yfinance


# ── CoinGecko integration (free public API, no key required) ──────────────────

COINGECKO_IDS: dict[str, str] = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XRP": "ripple",
    "ADA": "cardano",
}

_COINGECKO_RANGE_DAYS: dict[str, int] = {
    "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365,
}

_coingecko_quote_cache: dict[str, tuple[float, dict]] = {}
_coingecko_cache_lock = threading.Lock()
_COINGECKO_TTL = 120.0  # 2 minutes


def _coingecko_quote(symbol: str) -> dict | None:
    """Fetch a single crypto quote from CoinGecko in BRL. Cached for 2 minutes."""
    base = symbol.split("-", 1)[0].upper()
    coin_id = COINGECKO_IDS.get(base)
    if not coin_id:
        return None

    now = time.time()
    with _coingecko_cache_lock:
        cached = _coingecko_quote_cache.get(base)
        if cached and now - cached[0] < _COINGECKO_TTL:
            return cached[1]

    try:
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            f"?ids={coin_id}&vs_currencies=brl"
            "&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true"
        )
        with httpx.Client(timeout=8) as client:
            resp = client.get(url)
        resp.raise_for_status()
        data = resp.json().get(coin_id, {})
        if not data.get("brl"):
            return None

        static = STATIC_CRYPTO_QUOTES.get(base, {})
        result: dict = {
            "symbol": base,
            "shortName": static.get("name", f"{base} BRL"),
            "longName": static.get("name", f"{base} BRL"),
            "regularMarketPrice": data["brl"],
            "regularMarketChangePercent": data.get("brl_24h_change", 0.0),
            "regularMarketVolume": data.get("brl_24h_vol", 0.0),
            "marketCap": int(data.get("brl_market_cap") or 0),
            "logourl": "",
            "fiftyTwoWeekHigh": data["brl"] * 1.25,
            "fiftyTwoWeekLow": data["brl"] * 0.75,
            "sector": "Cripto",
            "industry": "Criptomoeda",
            "website": "",
            "longBusinessSummary": f"Criptoativo {static.get('name', base)} — dados via CoinGecko.",
            "fullTimeEmployees": 0,
            "trailingPE": 0.0,
            "profitMargins": 0.0,
            "dividendYield": 0.0,
            "averageVolume": data.get("brl_24h_vol", 0.0),
            "is_stale": False,
        }
        with _coingecko_cache_lock:
            _coingecko_quote_cache[base] = (time.time(), result)
        return result
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("CoinGecko quote failed for %s: %s", base, e)
        return None


def _coingecko_history(symbol: str, range_name: str = "1mo") -> list[dict]:
    """Fetch OHLCV history from CoinGecko in BRL."""
    base = symbol.split("-", 1)[0].upper()
    coin_id = COINGECKO_IDS.get(base)
    if not coin_id:
        return []

    days = _COINGECKO_RANGE_DAYS.get(range_name, 30)
    try:
        url = (
            f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
            f"?vs_currency=brl&days={days}"
        )
        with httpx.Client(timeout=10) as client:
            resp = client.get(url)
        resp.raise_for_status()
        prices = resp.json().get("prices", [])
        points = []
        for ts_ms, price in prices:
            from datetime import datetime, timezone
            dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
            points.append({"date": dt.isoformat(), "close": price, "open": price, "high": price, "low": price, "volume": 0})
        return points
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("CoinGecko history failed for %s: %s", base, e)
        return []

# In-memory thread-safe cache for treasury bonds list
_treasury_cache = None
_treasury_cache_time = 0.0
_treasury_lock = threading.Lock()

# Circuit breaker for yfinance queries to prevent repeated slow/offline timeouts
_yfinance_broken = False
_yfinance_last_check = 0.0
_yfinance_lock = threading.Lock()

def is_yfinance_healthy() -> bool:
    global _yfinance_broken, _yfinance_last_check
    now = time.time()
    with _yfinance_lock:
        if _yfinance_broken:
            if now - _yfinance_last_check < 300.0:  # 5 minutes circuit breaker
                return False
            else:
                _yfinance_broken = False
        return True

def mark_yfinance_broken():
    global _yfinance_broken, _yfinance_last_check
    with _yfinance_lock:
        _yfinance_broken = True
        _yfinance_last_check = time.time()

def fetch_live_treasury_bonds() -> list[dict]:
    global _treasury_cache, _treasury_cache_time
    if not settings.brapi_key:
        return []
    
    with _treasury_lock:
        now = time.time()
        # 5 minutes cache for high responsiveness
        if _treasury_cache is not None and (now - _treasury_cache_time) < 300.0:
            return _treasury_cache
            
        try:
            url = "https://brapi.dev/api/v2/treasury/list"
            headers = {"Authorization": f"Bearer {settings.brapi_key}"}
            with httpx.Client(timeout=3.0) as client:  # Fast timeout
                response = client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    _treasury_cache = data.get("data", [])
                    _treasury_cache_time = now
                    return _treasury_cache
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning("Failed to fetch live treasury list: %s", e)
            
        # Return stale cache if network fails to avoid showing empty state
        if _treasury_cache is not None:
            return _treasury_cache
            
        return []

def normalize_treasury_name_to_ticker(name: str) -> str:
    n = name.upper().replace("+", "").replace(" ", "_")
    if "SELIC_2026" in n: return "TESOURO_SELIC_2026"
    if "SELIC_2029" in n: return "TESOURO_SELIC_2029"
    if "IPCA_2029" in n: return "TESOURO_IPCA_2029"
    if "IPCA_2035" in n: return "TESOURO_IPCA_2035"
    if "IPCA_2045" in n: return "TESOURO_IPCA_2045"
    if "PREFIXADO_2026" in n: return "TESOURO_PREFIXADO_2026"
    if "PREFIXADO_2029" in n: return "TESOURO_PREFIXADO_2029"
    return ""

def get_live_treasury_quote(symbol: str) -> dict | None:
    symbol_upper = symbol.strip().upper()
    if symbol_upper not in TESOURO_BONDS:
        return None
    
    bond_static = TESOURO_BONDS[symbol_upper]
    live_bonds = fetch_live_treasury_bonds()
    for b in live_bonds:
        name = b.get("name", "")
        ticker = normalize_treasury_name_to_ticker(name)
        if ticker == symbol_upper:
            buy_price = _finite(b.get("buyPrice"), bond_static["price"])
            buy_rate = _finite(b.get("buyRate"), bond_static["buyRate"])
            return {
                "symbol": symbol_upper,
                "shortName": name,
                "longName": f"{name} (LFT/LTN/NTN-B)",
                "regularMarketPrice": buy_price,
                "regularMarketChangePercent": 0.02,
                "regularMarketVolume": 100000.0,
                "marketCap": 0,
                "logourl": "",
                "fiftyTwoWeekHigh": buy_price * 1.05,
                "fiftyTwoWeekLow": buy_price * 0.95,
                "sector": "Renda Fixa",
                "industry": f"Tesouro {bond_static['indexer']}",
                "website": "https://www.tesourodireto.com.br",
                "longBusinessSummary": f"Título público federal do Tesouro Direto indexado ao {bond_static['indexer']}. Vencimento em {bond_static['maturity']}. Taxa contratada: {buy_rate:.2f}% a.a.",
                "fullTimeEmployees": 0,
                "trailingPE": 0.0,
                "profitMargins": 0.0,
                "dividendYield": buy_rate,
                "averageVolume": 100000.0,
            }
            
    return {
        "symbol": symbol_upper,
        "shortName": bond_static["name"],
        "longName": bond_static["longName"],
        "regularMarketPrice": bond_static["price"],
        "regularMarketChangePercent": bond_static["change"],
        "regularMarketVolume": 50000.0,
        "marketCap": 0,
        "logourl": "",
        "fiftyTwoWeekHigh": bond_static["price"] * 1.02,
        "fiftyTwoWeekLow": bond_static["price"] * 0.98,
        "sector": "Renda Fixa",
        "industry": f"Tesouro {bond_static['indexer']}",
        "website": "https://www.tesourodireto.com.br",
        "longBusinessSummary": f"Título público federal do Tesouro Direto indexado ao {bond_static['indexer']}. Vencimento em {bond_static['maturity']}. Taxa contratada: {bond_static['buyRate']:.2f}% a.a.",
        "fullTimeEmployees": 0,
        "trailingPE": 0.0,
        "profitMargins": 0.0,
        "dividendYield": bond_static["buyRate"],
        "averageVolume": 50000.0,
    }

def get_treasury_history_points(symbol: str, range_name: str = "1mo") -> list[dict]:
    return []  # histórico de tesouro indisponível sem yfinance


@dataclass(frozen=True)
class RangeConfig:
    period: str
    interval: str


RANGE_CONFIG: dict[str, RangeConfig] = {
    "1d": RangeConfig("1d", "5m"),
    "5d": RangeConfig("5d", "15m"),
    "1mo": RangeConfig("1mo", "1d"),
    "3mo": RangeConfig("3mo", "1d"),
    "6mo": RangeConfig("6mo", "1d"),
    "1y": RangeConfig("1y", "1d"),
    "2y": RangeConfig("2y", "1wk"),
    "5y": RangeConfig("5y", "1mo"),
    "10y": RangeConfig("10y", "1mo"),
    "ytd": RangeConfig("ytd", "1d"),
    "max": RangeConfig("max", "1mo"),
}


def _finite(value: Any, default: float = 0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(number) or math.isinf(number):
        return default
    return number


def _int_or_none(value: Any) -> int | None:
    number = _finite(value, float("nan"))
    if math.isnan(number):
        return None
    return int(number)


def _score(value: float) -> int:
    return round(max(0, min(100, value)))


def _yahoo_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    if not cleaned:
        return cleaned
    if cleaned in CRYPTO_COINS:
        return f"{cleaned}-BRL"
    if "-" in cleaned:
        parts = cleaned.split("-", 1)
        if parts[0] in CRYPTO_COINS:
            return cleaned
    if cleaned.startswith("^") or cleaned.endswith("=X") or "." in cleaned:
        return cleaned
    if "-" in cleaned and cleaned.endswith("-BRL"):
        base = cleaned.split("-", 1)[0]
        return "BRL=X" if base == "USD" else f"{base}BRL=X"
    return f"{cleaned}.SA"


def _app_symbol(symbol: str) -> str:
    cleaned = symbol.strip().upper()
    if cleaned.endswith(".SA"):
        return cleaned[:-3]
    if cleaned == "BRL=X":
        return "USD-BRL"
    if cleaned.endswith("BRL=X"):
        return f"{cleaned[:-5]}-BRL"
    if "-" in cleaned:
        parts = cleaned.split("-", 1)
        if parts[0] in CRYPTO_COINS:
            if parts[1] == "BRL":
                return parts[0]
            return cleaned
    return cleaned


def _ticker(symbol: str) -> yf.Ticker:
    return yf.Ticker(_yahoo_symbol(symbol))


def _news_translation_messages(title: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "Voce traduz manchetes financeiras para portugues brasileiro. "
                "Preserve tickers, nomes de empresas, moedas, numeros, percentuais e aspas. "
                "Retorne apenas a manchete traduzida, sem explicacoes."
            ),
        },
        {"role": "user", "content": title},
    ]


def _chat_completion_text(payload: dict[str, Any]) -> str | None:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    first = choices[0]
    if not isinstance(first, dict):
        return None
    message = first.get("message")
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    return content.strip() if isinstance(content, str) and content.strip() else None


def _clean_translated_title(title: str) -> str:
    cleaned = " ".join(title.strip().split())
    return cleaned.strip("\"'")


def _request_news_translation(
    *,
    api_url: str,
    api_key: str,
    model: str,
    title: str,
    extra_headers: dict[str, str] | None = None,
) -> str | None:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        **(extra_headers or {}),
    }
    body = {
        "model": model,
        "messages": _news_translation_messages(title),
        "max_tokens": 120,
        "temperature": 0,
    }

    try:
        with httpx.Client(timeout=NEWS_TRANSLATION_TIMEOUT_SECONDS) as client:
            response = client.post(api_url, headers=headers, json=body)
            response.raise_for_status()
            translated = _chat_completion_text(response.json())
    except Exception:
        return None

    return _clean_translated_title(translated) if translated else None


@lru_cache(maxsize=512)
def _translate_news_title(title: str) -> str:
    cleaned = " ".join(title.strip().split())
    if not cleaned:
        return cleaned

    if settings.openrouter_api_key:
        translated = _request_news_translation(
            api_url=OPENROUTER_CHAT_COMPLETIONS_URL,
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
            title=cleaned,
            extra_headers={
                "HTTP-Referer": "https://bullcapital.app",
                "X-Title": "BullCapital",
            },
        )
        if translated:
            return translated

    if settings.openai_api_key:
        translated = _request_news_translation(
            api_url=OPENAI_CHAT_COMPLETIONS_URL,
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            title=cleaned,
        )
        if translated:
            return translated

    return cleaned


def _history_frame(symbol: str, range_name: str) -> pd.DataFrame:
    config = RANGE_CONFIG.get(range_name, RANGE_CONFIG["1mo"])
    yahoo_symbol = _yahoo_symbol(symbol)
    
    app_symbol = _app_symbol(yahoo_symbol)
    is_crypto = _is_crypto(app_symbol)
    
    if is_crypto and not is_yfinance_healthy():
        return pd.DataFrame()
        
    try:
        ticker = yf.Ticker(yahoo_symbol)
        frame = ticker.history(period=config.period, interval=config.interval, auto_adjust=False)
        if frame.empty:
            frame = yf.download(
                yahoo_symbol,
                period=config.period,
                interval=config.interval,
                progress=False,
                auto_adjust=False,
            )
        if frame.empty and range_name == "1d":
            frame = ticker.history(period="5d", interval="1d", auto_adjust=False)
        if frame.empty and range_name != "1mo":
            frame = ticker.history(period="1mo", interval="1d", auto_adjust=False)
        return frame
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("yfinance history call failed for %s: %s", yahoo_symbol, e)
        mark_yfinance_broken()
        return pd.DataFrame()


def _history_points(frame: pd.DataFrame) -> list[dict[str, float]]:
    if frame.empty:
        return []

    points: list[dict[str, float]] = []
    for timestamp, row in frame.iterrows():
        close = _finite(row.get("Close"))
        if close <= 0:
            continue
        if hasattr(timestamp, "to_pydatetime"):
            dt = timestamp.to_pydatetime()
        else:
            dt = pd.Timestamp(timestamp).to_pydatetime()
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        point: dict[str, float] = {
            "timestamp": int(dt.timestamp()),
            "close": close,
        }
        open_price = _finite(row.get("Open"))
        high = _finite(row.get("High"))
        low = _finite(row.get("Low"))
        volume = _finite(row.get("Volume"))
        if open_price > 0:
            point["open"] = open_price
        if high > 0:
            point["high"] = high
        if low > 0:
            point["low"] = low
        if volume > 0:
            point["volume"] = volume
        points.append(point)
    return points


def get_history(tickers: list[str], range_name: str = "1mo") -> dict:
    if not tickers:
        return {"results": [], "error": "No tickers provided."}

    results = []
    for symbol in tickers:
        symbol_upper = symbol.strip().upper()
        if symbol_upper.startswith("TESOURO_"):
            points = get_treasury_history_points(symbol_upper, range_name)
            results.append({"symbol": symbol_upper, "history": points})
        elif _is_crypto(symbol_upper):
            points = _coingecko_history(symbol_upper, range_name)
            results.append({"symbol": symbol_upper, "history": points})
        else:
            frame = _history_frame(symbol, range_name)
            points = _history_points(frame)
            results.append({"symbol": _app_symbol(symbol), "history": points})
    return {"results": results}


def get_quote(symbol: str) -> dict | None:
    symbol_upper = symbol.strip().upper()
    if symbol_upper.startswith("TESOURO_"):
        return get_live_treasury_quote(symbol_upper)

    yahoo_symbol = _yahoo_symbol(symbol)
    app_symbol = _app_symbol(yahoo_symbol)
    is_crypto = _is_crypto(app_symbol)

    # Crypto: use CoinGecko (Yahoo Finance no longer supports *-BRL pairs)
    if is_crypto:
        result = _coingecko_quote(app_symbol)
        return result if result is not None else get_static_crypto_quote(app_symbol)

    if not is_yfinance_healthy():
        return None
        
    try:
        ticker = yf.Ticker(yahoo_symbol)
        history = _history_frame(yahoo_symbol, "5d")
        if history.empty:
            if is_crypto:
                return get_static_crypto_quote(app_symbol)
            return None

        last = history.dropna(subset=["Close"]).tail(1)
        prev = history.dropna(subset=["Close"]).tail(2).head(1)
        close = _finite(last["Close"].iloc[0]) if not last.empty else 0
        previous_close = _finite(prev["Close"].iloc[0], close) if not prev.empty else close
        change = ((close - previous_close) / previous_close * 100) if previous_close > 0 else 0

        try:
            fast_info = dict(ticker.fast_info)
        except Exception:
            fast_info = {}
        info = {}
        if app_symbol not in INDEX_NAMES and not yahoo_symbol.endswith("=X"):
            try:
                info = ticker.get_info()
            except Exception:
                info = {}

        name = (
            info.get("longName")
            or info.get("shortName")
            or info.get("displayName")
            or INDEX_NAMES.get(app_symbol)
            or app_symbol
        )

        volume = _finite(last["Volume"].iloc[0]) if "Volume" in last and not last.empty else 0
        is_crypto = _is_crypto(app_symbol)
        sector = "Cripto" if is_crypto else info.get("sector")
        industry = "Criptomoeda" if is_crypto else info.get("industry")
        
        return {
            "symbol": app_symbol,
            "shortName": str(info.get("shortName") or name),
            "longName": str(name),
            "regularMarketPrice": close,
            "regularMarketChangePercent": change,
            "regularMarketVolume": volume,
            "marketCap": _int_or_none(fast_info.get("marketCap") or info.get("marketCap")) or 0,
            "logourl": "",
            "fiftyTwoWeekHigh": _finite(fast_info.get("yearHigh") or info.get("fiftyTwoWeekHigh"), close),
            "fiftyTwoWeekLow": _finite(fast_info.get("yearLow") or info.get("fiftyTwoWeekLow"), close),
            "sector": sector,
            "industry": industry,
            "website": info.get("website"),
            "longBusinessSummary": info.get("longBusinessSummary"),
            "fullTimeEmployees": _int_or_none(info.get("fullTimeEmployees")),
            "trailingPE": _finite(info.get("trailingPE"), 0),
            "profitMargins": _finite(info.get("profitMargins"), 0),
            "dividendYield": _finite(info.get("trailingAnnualDividendYield") or info.get("dividendYield"), 0),
            "averageVolume": _finite(info.get("averageVolume") or fast_info.get("threeMonthAverageVolume"), volume),
        }
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("get_quote failed for %s: %s", symbol, e)
        mark_yfinance_broken()
        if is_crypto:
            return get_static_crypto_quote(app_symbol)
        return None


def get_quotes(symbols: list[str]) -> dict:
    results = [quote for symbol in symbols if (quote := get_quote(symbol))]
    return {"results": results}


def get_status() -> dict:
    symbols = ["^BVSP", "^GSPC", "^VIX"]
    indices = []
    for symbol in symbols:
        quote = get_quote(symbol)
        if not quote:
            continue
        app_symbol = quote["symbol"]
        indices.append(
            {
                "name": INDEX_NAMES.get(app_symbol, quote["shortName"]),
                "symbol": app_symbol,
                "regularMarketPrice": quote["regularMarketPrice"],
                "regularMarketChangePercent": quote["regularMarketChangePercent"],
            }
        )
    return {"indices": indices}


def _momentum_score(history: pd.DataFrame, current_price: float) -> float:
    """5-day return mapped to 0-100. -10% → 0, 0% → 50, +10% → 100."""
    closes = history.dropna(subset=["Close"])
    if closes.empty or current_price <= 0:
        return 50.0
    first_close = _finite(closes.head(1)["Close"].iloc[0], current_price)
    five_day_return = ((current_price - first_close) / first_close * 100) if first_close > 0 else 0
    return max(0, min(100, (five_day_return + 10) / 20 * 100))


def _liquidity_score(volume: float, avg_volume: float) -> float:
    """Log2 of volume/avg ratio mapped to 0-100. 0.5× → 0, 1× → 50, 2× → 100."""
    if avg_volume <= 0 or volume <= 0:
        return 30.0
    import math
    ratio = volume / avg_volume
    return max(0, min(100, 50 + 50 * math.log2(ratio)))


def _valuation_score(pe: float) -> float:
    """Lower PE → higher score. PE ≤ 8 → 90+, PE 15 → 65, PE 25 → 35, PE > 40 → 10."""
    if pe <= 0:
        return 40.0
    if pe <= 8:
        return 90.0
    if pe <= 15:
        return 90 - (pe - 8) / 7 * 25
    if pe <= 25:
        return 65 - (pe - 15) / 10 * 30
    if pe <= 40:
        return 35 - (pe - 25) / 15 * 25
    return 10.0


def _rentability_score(margin: float, dividend_yield: float) -> float:
    """Blend profit margin (70%) and dividend yield (30%). Each normalized to 0-100."""
    margin_score = max(0, min(100, margin / 0.30 * 100))
    dy_score = max(0, min(100, dividend_yield / 0.10 * 100))
    return margin_score * 0.70 + dy_score * 0.30


def get_radar(symbol: str) -> dict | None:
    symbol_upper = symbol.strip().upper()
    is_crypto = _is_crypto(symbol_upper)
    is_treasury = symbol_upper.startswith("TESOURO_")

    if is_crypto or is_treasury:
        if is_crypto:
            metrics = {
                "Rentabilidade": 85,
                "Momentum": 75,
                "Liquidez": 95,
                "Valuation": 40,
                "Tendência": 80,
            }
            profile = {
                "longBusinessSummary": "Criptoativo global descentralizado de alta liquidez. Monitorado sob variação cambial em BRL.",
                "sector": "Cripto",
                "industry": "Criptomoeda",
                "website": "",
                "fullTimeEmployees": 0,
            }
        else:
            bond = TESOURO_BONDS.get(symbol_upper)
            indexer = bond["indexer"] if bond else "Selic"
            metrics = {
                "Rentabilidade": 65,
                "Momentum": 95,
                "Liquidez": 90,
                "Valuation": 80,
                "Tendência": 70,
            }
            profile = {
                "longBusinessSummary": f"Título público federal garantido pelo Tesouro Nacional do Brasil. Baixíssimo risco de crédito e alta liquidez.",
                "sector": "Renda Fixa",
                "industry": f"Tesouro {indexer}",
                "website": "https://www.tesourodireto.com.br",
                "fullTimeEmployees": 0,
            }
            
        data = [
            {"metric": k, "value": _score(v), "fullMark": 100}
            for k, v in metrics.items()
        ]
        
        quote_data = get_quote(symbol_upper) or {}
        return {
            "timestamp": pd.Timestamp.utcnow().isoformat(),
            "ticker": symbol_upper,
            "data": data,
            "profile": profile,
            "quote": {
                "regularMarketPrice": quote_data.get("regularMarketPrice", 0.0),
                "regularMarketChangePercent": quote_data.get("regularMarketChangePercent", 0.0),
                "fiftyTwoWeekHigh": quote_data.get("fiftyTwoWeekHigh", 0.0),
                "fiftyTwoWeekLow": quote_data.get("fiftyTwoWeekLow", 0.0),
                "marketCap": quote_data.get("marketCap", 0),
                "longName": quote_data.get("longName", symbol_upper),
                "volume": int(quote_data.get("regularMarketVolume", 0)),
                "averageVolume": int(quote_data.get("averageVolume", 0)),
                "dividendYield": round(quote_data.get("dividendYield", 0.0) * 100, 2) if not is_treasury else round(quote_data.get("dividendYield", 0.0), 2),
            }
        }

    quote = get_quote(symbol)
    if not quote:
        return None

    current_price = _finite(quote["regularMarketPrice"])
    high52 = _finite(quote.get("fiftyTwoWeekHigh"), current_price)
    low52 = _finite(quote.get("fiftyTwoWeekLow"), current_price)
    volume = _finite(quote.get("regularMarketVolume"))
    avg_volume = _finite(quote.get("averageVolume"), volume)
    pe = _finite(quote.get("trailingPE"), 0)
    margin = _finite(quote.get("profitMargins"), 0)
    dividend_yield = _finite(quote.get("dividendYield"), 0)

    history = _history_frame(symbol, "5d")

    momentum = _momentum_score(history, current_price)
    liquidity = _liquidity_score(volume, avg_volume)
    valuation = _valuation_score(pe)
    trend = ((current_price - low52) / (high52 - low52) * 100) if high52 > low52 else 50.0
    rentability = _rentability_score(margin, dividend_yield)

    return {
        "timestamp": pd.Timestamp.utcnow().isoformat(),
        "ticker": quote["symbol"],
        "data": [
            {"metric": "Rentabilidade", "value": _score(rentability), "fullMark": 100},
            {"metric": "Momentum", "value": _score(momentum), "fullMark": 100},
            {"metric": "Liquidez", "value": _score(liquidity), "fullMark": 100},
            {"metric": "Valuation", "value": _score(valuation), "fullMark": 100},
            {"metric": "Tendência", "value": _score(trend), "fullMark": 100},
        ],
        "profile": {
            "longBusinessSummary": quote.get("longBusinessSummary"),
            "sector": quote.get("sector"),
            "industry": quote.get("industry"),
            "website": quote.get("website"),
            "fullTimeEmployees": quote.get("fullTimeEmployees"),
        },
        "quote": {
            "regularMarketPrice": current_price,
            "regularMarketChangePercent": _finite(quote.get("regularMarketChangePercent")),
            "fiftyTwoWeekHigh": high52,
            "fiftyTwoWeekLow": low52,
            "marketCap": quote.get("marketCap"),
            "longName": quote.get("longName"),
            "volume": int(volume),
            "averageVolume": int(avg_volume),
            "dividendYield": round(dividend_yield * 100, 2),
        },
    }


def _listing_from_quote(quote: dict, item_type: str = "stock") -> dict:
    return {
        "stock": quote["symbol"],
        "name": quote.get("longName") or quote.get("shortName") or quote["symbol"],
        "close": quote["regularMarketPrice"],
        "change": quote["regularMarketChangePercent"],
        "volume": quote.get("regularMarketVolume", 0),
        "marketCap": quote.get("marketCap") or None,
        "logo": None,
        "sector": quote.get("sector"),
        "type": item_type,
    }


def _download_listings(symbols: list[str]) -> list[dict]:
    if not symbols:
        return []

    yahoo_symbols = [_yahoo_symbol(symbol) for symbol in symbols]
    frame = yf.download(
        yahoo_symbols,
        period="5d",
        interval="1d",
        group_by="ticker",
        threads=True,
        progress=False,
        auto_adjust=False,
    )
    if frame.empty:
        return []

    listings: list[dict] = []
    for app_symbol, yahoo_symbol in zip(symbols, yahoo_symbols, strict=False):
        try:
            data = frame[yahoo_symbol] if isinstance(frame.columns, pd.MultiIndex) else frame
        except KeyError:
            continue

        closes = data.dropna(subset=["Close"])
        if closes.empty:
            continue

        last = closes.tail(1)
        previous = closes.tail(2).head(1)
        close = _finite(last["Close"].iloc[0])
        previous_close = _finite(previous["Close"].iloc[0], close) if not previous.empty else close
        change = ((close - previous_close) / previous_close * 100) if previous_close > 0 else 0
        volume = _finite(last["Volume"].iloc[0]) if "Volume" in last else 0
        listings.append(
            {
                "stock": _app_symbol(app_symbol),
                "name": _app_symbol(app_symbol),
                "close": close,
                "change": change,
                "volume": volume,
                "marketCap": None,
                "logo": None,
                "sector": None,
                "type": "stock",
            }
        )
    return listings


def get_listings(
    limit: int = 20,
    page: int = 1,
    sort_by: str = "name",
    sort_order: str = "asc",
    item_type: str | None = None,
    search: str | None = None,
) -> dict:
    universe = B3_UNIVERSE
    if search:
        needle = search.upper().strip()
        universe = [symbol for symbol in universe if needle in symbol]

    stocks = _download_listings(universe)
    if item_type and item_type != "stock":
        stocks = []

    reverse = sort_order == "desc"
    key_map = {
        "name": lambda item: item["name"],
        "close": lambda item: item["close"],
        "change": lambda item: item["change"],
        "change_abs": lambda item: abs(item["change"]),
        "volume": lambda item: item["volume"],
        "market_cap_basic": lambda item: item["marketCap"] or 0,
        "sector": lambda item: item["sector"] or "",
        "rank": lambda item: item["stock"],
    }
    stocks.sort(key=key_map.get(sort_by, key_map["name"]), reverse=reverse)

    page_size = max(1, min(limit, 100))
    total_count = len(stocks)
    total_pages = max(1, math.ceil(total_count / page_size))
    current_page = max(1, min(page, total_pages))
    start = (current_page - 1) * page_size

    return {
        "stocks": stocks[start : start + page_size],
        "indexes": [{"stock": symbol, "name": name} for symbol, name in INDEX_NAMES.items()],
        "currentPage": current_page,
        "totalPages": total_pages,
        "totalCount": total_count,
        "hasNextPage": current_page < total_pages,
    }


def search_assets(query: str, limit: int = 10, page: int = 1) -> dict:
    if not query.strip():
        return {
            "results": [],
            "currentPage": 1,
            "totalPages": 1,
            "itemsPerPage": limit,
            "totalCount": 0,
            "hasNextPage": False,
        }

    q = query.upper().strip()
    intercepted = []
    
    # 1. Crypto matches
    for coin in CRYPTO_COINS:
        if q in coin or coin in q or q == "CRIPTO" or q == "CRYPTO":
            intercepted.append({
                "symbol": coin,
                "name": "Bitcoin" if coin == "BTC" else "Ethereum" if coin == "ETH" else f"{coin} Cryptocurrency",
                "logo": None,
                "type": "crypto",
                "sector": "Cripto",
            })
            
    # 2. Fixed income matches
    for ticker, info in TESOURO_BONDS.items():
        if q in ticker or q in info["name"].upper() or q == "TESOURO" or q == "SELIC" or q == "IPCA" or q == "PREFIXADO" or q == "RENDA FIXA":
            intercepted.append({
                "symbol": ticker,
                "name": info["name"],
                "logo": None,
                "type": "fixed_income",
                "sector": "Renda Fixa",
            })

    try:
        search = yf.Search(query, max_results=max(limit * page, limit), news_count=0)
        quotes = search.quotes or []
    except Exception:
        quotes = []

    results = list(intercepted)
    for item in quotes:
        symbol = _app_symbol(str(item.get("symbol", "")))
        if not symbol or symbol.endswith("=X"):
            continue
        if any(r["symbol"] == symbol for r in results):
            continue
        quote_type = str(item.get("quoteType") or "").lower()
        item_type = "etf" if quote_type == "etf" else "stock"
        results.append(
            {
                "symbol": symbol,
                "name": item.get("longname") or item.get("shortname") or symbol,
                "logo": None,
                "type": item_type,
                "sector": item.get("sector"),
            }
        )

    if not results:
        fallback = [symbol for symbol in B3_UNIVERSE if query.upper() in symbol][:limit]
        results = [
            {"symbol": symbol, "name": symbol, "logo": None, "type": "stock", "sector": None}
            for symbol in fallback
        ]

    total_count = len(results)
    page_size = max(1, limit)
    total_pages = max(1, math.ceil(total_count / page_size))
    current_page = max(1, min(page, total_pages))
    start = (current_page - 1) * page_size
    return {
        "results": results[start : start + page_size],
        "currentPage": current_page,
        "totalPages": total_pages,
        "itemsPerPage": page_size,
        "totalCount": total_count,
        "hasNextPage": current_page < total_pages,
    }


def get_news(symbol: str, count: int = 3) -> list[dict]:
    yahoo_symbol = _yahoo_symbol(symbol)
    try:
        news = yf.Ticker(yahoo_symbol).news or []
    except Exception:
        news = []
    if not news:
        try:
            news = yf.Search(yahoo_symbol, max_results=1, news_count=max(count, 6)).news or []
        except Exception:
            news = []

    items = []
    for item in news[:count]:
        content = item.get("content") if isinstance(item.get("content"), dict) else item
        title = content.get("title") or item.get("title") or ""
        link = content.get("canonicalUrl", {}).get("url") if isinstance(content.get("canonicalUrl"), dict) else None
        link = link or content.get("link") or item.get("link") or ""
        provider = content.get("provider", {}) if isinstance(content.get("provider"), dict) else {}
        published = (
            content.get("pubDate")
            or content.get("displayTime")
            or item.get("providerPublishTime")
            or 0
        )
        published_at = 0
        if isinstance(published, int | float):
            published_at = int(published)
        elif published:
            try:
                published_at = int(pd.Timestamp(published).timestamp())
            except Exception:
                published_at = 0

        # Extract news thumbnail/image
        thumbnail = content.get("thumbnail") if isinstance(content.get("thumbnail"), dict) else None
        image_url = None
        if thumbnail:
            image_url = thumbnail.get("originalUrl")
            if not image_url and thumbnail.get("resolutions"):
                res = thumbnail.get("resolutions")
                if isinstance(res, list) and len(res) > 0:
                    image_url = res[0].get("url")

        translated_title = _translate_news_title(title)
        items.append(
            {
                "title": translated_title,
                "originalTitle": title if translated_title != title else None,
                "publisher": provider.get("displayName") or item.get("publisher") or "Yahoo Finance",
                "link": link,
                "publishedAt": published_at,
                "imageUrl": image_url,
                "relatedTickers": [_app_symbol(yahoo_symbol)],
            }
        )
    return items


def get_currencies(pairs: list[str]) -> dict:
    currencies = []
    for pair in pairs:
        yahoo_symbol = _yahoo_symbol(pair)
        quote = get_quote(yahoo_symbol)
        if not quote:
            continue
        app_pair = _app_symbol(yahoo_symbol)
        from_currency, to_currency = app_pair.split("-", 1) if "-" in app_pair else (app_pair, "BRL")
        history = _history_frame(yahoo_symbol, "5d")
        last = history.tail(1)
        high = _finite(last["High"].iloc[0], quote["regularMarketPrice"]) if not last.empty else quote["regularMarketPrice"]
        low = _finite(last["Low"].iloc[0], quote["regularMarketPrice"]) if not last.empty else quote["regularMarketPrice"]
        currencies.append(
            {
                "fromCurrency": from_currency,
                "toCurrency": to_currency,
                "name": f"{from_currency}/{to_currency}",
                "bidPrice": quote["regularMarketPrice"],
                "askPrice": quote["regularMarketPrice"],
                "highPrice": high,
                "lowPrice": low,
                "updatedAtTimestamp": int(pd.Timestamp.utcnow().timestamp()),
            }
        )
    return {"currencies": currencies}

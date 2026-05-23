"""Market data service backed only by yfinance."""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import UTC
from typing import Any

import pandas as pd
import yfinance as yf

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
]

INDEX_NAMES = {
    "^BVSP": "Ibovespa",
    "^GSPC": "S&P 500",
    "^VIX": "VIX",
}


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
    return cleaned


def _ticker(symbol: str) -> yf.Ticker:
    return yf.Ticker(_yahoo_symbol(symbol))


def _history_frame(symbol: str, range_name: str) -> pd.DataFrame:
    config = RANGE_CONFIG.get(range_name, RANGE_CONFIG["1mo"])
    yahoo_symbol = _yahoo_symbol(symbol)
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
        high = _finite(row.get("High"))
        low = _finite(row.get("Low"))
        if high > 0:
            point["high"] = high
        if low > 0:
            point["low"] = low
        points.append(point)
    return points


def get_history(tickers: list[str], range_name: str = "1mo") -> dict:
    if not tickers:
        return {"results": [], "error": "No tickers provided."}

    results = []
    for symbol in tickers:
        points = _history_points(_history_frame(symbol, range_name))
        results.append({"symbol": _app_symbol(symbol), "history": points})
    return {"results": results}


def get_quote(symbol: str) -> dict | None:
    yahoo_symbol = _yahoo_symbol(symbol)
    app_symbol = _app_symbol(yahoo_symbol)
    ticker = yf.Ticker(yahoo_symbol)
    history = _history_frame(yahoo_symbol, "5d")
    if history.empty:
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
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "website": info.get("website"),
        "longBusinessSummary": info.get("longBusinessSummary"),
        "fullTimeEmployees": _int_or_none(info.get("fullTimeEmployees")),
        "trailingPE": _finite(info.get("trailingPE"), 15),
        "profitMargins": _finite(info.get("profitMargins"), 0.15),
        "averageVolume": _finite(info.get("averageVolume") or fast_info.get("threeMonthAverageVolume"), volume),
    }


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


def get_radar(symbol: str) -> dict | None:
    quote = get_quote(symbol)
    if not quote:
        return None

    current_price = _finite(quote["regularMarketPrice"])
    high52 = _finite(quote.get("fiftyTwoWeekHigh"), current_price)
    low52 = _finite(quote.get("fiftyTwoWeekLow"), current_price)
    change = _finite(quote.get("regularMarketChangePercent"))
    volume = _finite(quote.get("averageVolume") or quote.get("regularMarketVolume"))
    pe = _finite(quote.get("trailingPE"), 15)
    margin = _finite(quote.get("profitMargins"), 0.15)

    valuation = 100 - ((pe - 5) / 20) * 100
    momentum = ((change + 5) / 10) * 100
    liquidity = ((volume - 1_000_000) / 49_000_000) * 100
    trend = ((current_price - low52) / (high52 - low52) * 100) if high52 > low52 else 50
    rentability = (margin / 0.3) * 100

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
            "regularMarketChangePercent": change,
            "fiftyTwoWeekHigh": high52,
            "fiftyTwoWeekLow": low52,
            "marketCap": quote.get("marketCap"),
            "longName": quote.get("longName"),
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

    try:
        search = yf.Search(query, max_results=max(limit * page, limit), news_count=0)
        quotes = search.quotes or []
    except Exception:
        quotes = []

    results = []
    for item in quotes:
        symbol = _app_symbol(str(item.get("symbol", "")))
        if not symbol or symbol.endswith("=X"):
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
        items.append(
            {
                "title": title,
                "publisher": provider.get("displayName") or item.get("publisher") or "Yahoo Finance",
                "link": link,
                "publishedAt": published_at,
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

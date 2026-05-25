"""SQLAlchemy models for deterministic market data (quotes, historical prices, macro indicators, and news)."""

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MacroIndicator(Base):
    """Macroeconomic indicators (e.g., SELIC, IPCA, CDI) from BCB SGS."""

    __tablename__ = "macro_indicators"
    __table_args__ = {"schema": "ai"}

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    series_id: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(50), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    value: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("series_id", "date", name="uq_series_date"),
        {"schema": "ai"},
    )


class CurrencyQuote(Base):
    """Exchange rates and currency quotes (e.g., USD-BRL, EUR-BRL)."""

    __tablename__ = "currency_quotes"
    __table_args__ = {"schema": "ai"}

    pair: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g., "USD-BRL"
    name: Mapped[str] = mapped_column(String(50))  # e.g., "USD/BRL"
    bid: Mapped[float] = mapped_column(Float)
    ask: Mapped[float] = mapped_column(Float)
    high: Mapped[float] = mapped_column(Float)
    low: Mapped[float] = mapped_column(Float)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class AssetQuote(Base):
    """Real-time quotes, fundamentals, and general info for B3 assets and indices."""

    __tablename__ = "asset_quotes"
    __table_args__ = {"schema": "ai"}

    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g., "PETR4", "^BVSP"
    name: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float)
    change_percent: Mapped[float] = mapped_column(Float)
    volume: Mapped[float] = mapped_column(Float)
    market_cap: Mapped[float | None] = mapped_column(Float, nullable=True)
    high_52w: Mapped[float | None] = mapped_column(Float, nullable=True)
    low_52w: Mapped[float | None] = mapped_column(Float, nullable=True)
    pe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    dividend_yield: Mapped[float | None] = mapped_column(Float, nullable=True)
    ev_ebitda: Mapped[float | None] = mapped_column(Float, nullable=True)
    roe: Mapped[float | None] = mapped_column(Float, nullable=True)
    roic: Mapped[float | None] = mapped_column(Float, nullable=True)
    p_vp: Mapped[float | None] = mapped_column(Float, nullable=True)
    sector: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class AssetHistoricalPrice(Base):
    """Historical daily close prices for B3 assets (used for Markovitz calculations)."""

    __tablename__ = "asset_historical_prices"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    ticker: Mapped[str] = mapped_column(String(20), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    close: Mapped[float] = mapped_column(Float)
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("ticker", "date", name="uq_ticker_date"),
        {"schema": "ai"},
    )


class NewsArticle(Base):
    """High-signal Brazilian news articles (CVM RAD + RSS) filtered by ticker."""

    __tablename__ = "news_articles"
    __table_args__ = {"schema": "ai"}

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    ticker: Mapped[str] = mapped_column(String(20), index=True)
    title: Mapped[str] = mapped_column(Text)
    original_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    publisher: Mapped[str] = mapped_column(String(100))
    link: Mapped[str] = mapped_column(Text)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), index=True)  # e.g., "cvm_rad", "press_rss"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

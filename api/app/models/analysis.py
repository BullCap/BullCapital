"""Analysis cache model for storing analysis results."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AnalysisCache(Base):
    """Cached analysis results."""

    __tablename__ = "analysis_cache"
    __table_args__ = {"schema": "ai"}

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    ticker: Mapped[str] = mapped_column(Text, index=True)
    analysis_type: Mapped[str] = mapped_column(Text, index=True)
    summary: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

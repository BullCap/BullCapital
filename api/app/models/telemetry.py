"""SQLAlchemy model for agent execution telemetry and costs."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AgentTelemetry(Base):
    """Telemetry log for monitoring LLM usage, agent decisions, latencies, and financial costs."""

    __tablename__ = "agent_telemetry_logs"
    __table_args__ = {"schema": "ai"}

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True, index=True)
    prompt: Mapped[str] = mapped_column(Text)
    response: Mapped[str] = mapped_column(Text)
    latency: Mapped[float] = mapped_column(Float)  # Latency in seconds
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)  # Estimated USD cost
    agent_name: Mapped[str] = mapped_column(String(100), index=True)  # Name/role of the agent
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )

"""Routes module exports."""

from app.api.routes.analysis import router as analysis_router
from app.api.routes.comparator import router as comparator_router
from app.api.routes.conversation import router as conversation_router
from app.api.routes.health import router as health_router
from app.api.routes.market import router as market_router

__all__ = [
    "health_router",
    "analysis_router",
    "conversation_router",
    "market_router",
    "comparator_router",
]

"""API module with all routers."""

from fastapi import APIRouter

from app.api.routes import analysis_router, chat_router, health_router

api_router = APIRouter()

# Include all routers
api_router.include_router(health_router)
api_router.include_router(chat_router)
api_router.include_router(analysis_router)

__all__ = ["api_router"]

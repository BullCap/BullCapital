"""API module with all routers."""

from fastapi import APIRouter

from app.api.routes import analysis_router, conversation_router, health_router

api_router = APIRouter()

# Include all routers
api_router.include_router(health_router)
api_router.include_router(analysis_router)
api_router.include_router(conversation_router)

__all__ = ["api_router"]

"""Health check router."""

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-service"}


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    """Readiness check endpoint."""
    # TODO: Add database connectivity check
    return {"status": "ready"}

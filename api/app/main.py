"""BullCapital AI Service - FastAPI Application."""

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from hmac import compare_digest

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy import text

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, engine

INTERNAL_TOKEN_HEADER = "X-Bull-Internal-Token"
PUBLIC_PATHS = {"/", "/docs", "/redoc", "/openapi.json"}


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Lifespan event handler for startup and shutdown actions."""
    # Startup: Ensure the database tables are created in pgvector context
    async with engine.begin() as conn:
        # Ensure 'ai' schema exists
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS ai"))
        # Create all tables programmatically
        await conn.run_sync(Base.metadata.create_all)
        # create_all does not alter existing tables; keep the market cache compatible
        # with the Brapi PRO OHLCV expansion without requiring Alembic for MVP.
        await conn.execute(
            text("ALTER TABLE IF EXISTS ai.asset_historical_prices ADD COLUMN IF NOT EXISTS open DOUBLE PRECISION")
        )
        await conn.execute(
            text("ALTER TABLE IF EXISTS ai.asset_historical_prices ADD COLUMN IF NOT EXISTS high DOUBLE PRECISION")
        )
        await conn.execute(
            text("ALTER TABLE IF EXISTS ai.asset_historical_prices ADD COLUMN IF NOT EXISTS low DOUBLE PRECISION")
        )
        # Ensure news cache has the (ticker, link) idempotency constraint used by RSS ingestion.
        await conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'uq_news_ticker_link'
                    ) THEN
                        ALTER TABLE ai.news_articles
                        ADD CONSTRAINT uq_news_ticker_link UNIQUE (ticker, link);
                    END IF;
                END$$;
                """
            )
        )
    yield
    # Shutdown: Close engine connection
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="Serviço de IA para análises contextuais de mercado",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


def is_public_path(path: str) -> bool:
    """Keep health and documentation reachable without the internal token."""
    return path in PUBLIC_PATHS or path == f"{settings.api_prefix}/health"


@app.middleware("http")
async def require_internal_token(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Protect Railway APIs from direct public usage when a shared secret is configured."""
    if settings.api_shared_secret and not is_public_path(request.url.path):
        provided = request.headers.get(INTERNAL_TOKEN_HEADER, "")
        if not compare_digest(provided, settings.api_shared_secret):
            return JSONResponse({"detail": "Não autorizado"}, status_code=401)

    return await call_next(request)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }

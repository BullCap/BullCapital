import asyncio
import logging
import threading
import time
from collections import defaultdict
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

logger = logging.getLogger(__name__)

# IP-based sliding window rate limiter for costly LLM/AI endpoints.
# NOTE: state is per-process — effective limit is N_workers × requests_limit when
# running multiple uvicorn workers. Correct only for single-process deployments
# (current Railway setup). A Redis/DB-backed limiter is needed before scaling.
class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            self.requests[key] = [t for t in self.requests[key] if now - t < self.window_seconds]
            if len(self.requests[key]) >= self.requests_limit:
                return False
            self.requests[key].append(now)
            return True

ai_rate_limiter = RateLimiter(requests_limit=10, window_seconds=60)

INTERNAL_TOKEN_HEADER = "X-Bull-Internal-Token"
PUBLIC_PATHS = {"/", "/docs", "/redoc", "/openapi.json"}


async def quotes_scheduler_loop():
    """Background task to sync quotes: every 2 min during B3 session, every 30 min outside."""
    from app.services.market_db import _is_b3_session
    await asyncio.sleep(30)
    while True:
        try:
            if _is_b3_session():
                async with engine.connect() as conn:
                    result = await conn.execute(text("SELECT pg_try_advisory_lock(1001)"))
                    locked = bool(result.scalar())
                    if locked:
                        logger.info("Scheduler: Triggering scheduled quotes ingestion...")
                        try:
                            from app.services.market_ingest import ingest_all_quotes
                            await ingest_all_quotes()
                        finally:
                            await conn.execute(text("SELECT pg_advisory_unlock(1001)"))
                    else:
                        logger.debug("Scheduler: Quotes ingestion already running on another worker.")
        except Exception as e:
            logger.error(f"Scheduler error in quotes_scheduler_loop: {e}", exc_info=True)
        # Re-check session after ingest (may cross market open/close boundary)
        await asyncio.sleep(120 if _is_b3_session() else 1800)


async def macro_news_scheduler_loop():
    """Background task to sync macro indicators and news periodically (every 12 hours)."""
    # Wait 60 seconds after startup
    await asyncio.sleep(60)
    while True:
        try:
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT pg_try_advisory_lock(1002)"))
                locked = bool(result.scalar())
                if locked:
                    logger.info("Scheduler: Triggering scheduled macro indicators and news ingestion...")
                    try:
                        from app.services.bcb_sgs import ingest_macro_indicators, ingest_ptax_dollar
                        from app.services.news_ingest import ingest_brazilian_news

                        jobs: list[Awaitable[object]] = [ingest_brazilian_news()]
                        if settings.market_schedulers_enabled:
                            jobs += [ingest_macro_indicators(), ingest_ptax_dollar()]
                        results = await asyncio.gather(*jobs, return_exceptions=True)
                        for outcome in results:
                            if isinstance(outcome, Exception):
                                logger.warning("Scheduler child ingestion failed: %s", outcome)
                    finally:
                        await conn.execute(text("SELECT pg_advisory_unlock(1002)"))
                else:
                    logger.debug("Scheduler: Macro/news ingestion already running on another worker.")
        except Exception as e:
            logger.error(f"Scheduler error in macro_news_scheduler_loop: {e}", exc_info=True)
        await asyncio.sleep(12 * 3600)


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
        await conn.execute(
            text("ALTER TABLE IF EXISTS ai.macro_indicators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
        )
        # Create composite indexes to speed up reads in production
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_news_ticker_published ON ai.news_articles (ticker, published_at DESC)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_history_ticker_date ON ai.asset_historical_prices (ticker, date DESC)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_macro_name_date ON ai.macro_indicators (name, date DESC)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_asset_quotes_updated_at ON ai.asset_quotes (updated_at DESC)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_asset_quotes_change ON ai.asset_quotes (change_percent)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_asset_quotes_volume ON ai.asset_quotes (volume)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_asset_quotes_market_cap ON ai.asset_quotes (market_cap)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_asset_quotes_name ON ai.asset_quotes (name)")
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

    # Cold-start: populate DB if quotes table is empty (happens on first deploy or after wipe)
    async def cold_start_ingest() -> None:
        await asyncio.sleep(5)
        try:
            async with engine.connect() as conn:
                row = await conn.execute(text("SELECT COUNT(*) FROM ai.asset_quotes"))
                count = row.scalar() or 0
            if count == 0:
                logger.info("Cold-start: asset_quotes is empty — triggering initial ingestion")
                from app.services.bcb_sgs import ingest_macro_indicators, ingest_ptax_dollar
                from app.services.market_ingest import ingest_all_quotes
                from app.services.news_ingest import ingest_brazilian_news

                jobs: list[Awaitable[object]] = [ingest_brazilian_news()]
                if settings.market_schedulers_enabled:
                    jobs += [
                        ingest_all_quotes(),
                        ingest_macro_indicators(),
                        ingest_ptax_dollar(),
                    ]
                await asyncio.gather(*jobs, return_exceptions=True)
                logger.info("Cold-start ingestion complete")
        except Exception as e:
            logger.error("Cold-start ingestion failed: %s", e, exc_info=True)

    # Start background scheduler loops. Quotes loop only runs while this service
    # still owns market ingestion (pre-F3); macro/news loop always runs but skips
    # the market jobs when the Vercel Cron handlers take over.
    scheduler_tasks = [
        asyncio.create_task(cold_start_ingest()),
        asyncio.create_task(macro_news_scheduler_loop()),
    ]
    if settings.market_schedulers_enabled:
        scheduler_tasks.append(asyncio.create_task(quotes_scheduler_loop()))
    yield
    # Shutdown: Cancel background scheduler tasks
    for task in scheduler_tasks:
        task.cancel()
    await asyncio.gather(*scheduler_tasks, return_exceptions=True)
    # Close engine connection
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="Serviço de IA para análises contextuais de mercado",
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
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


@app.middleware("http")
async def rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Rate limit LLM and costly AI endpoints by IP address (max 10 req/minute)."""
    path = request.url.path
    if any(prefix in path for prefix in ("/api/v1/analysis", "/api/v1/conversation", "/api/v1/comparator")):
        ip = request.client.host if request.client else "unknown"
        if not ai_rate_limiter.is_allowed(ip):
            return JSONResponse(
                {"detail": "Limite de requisições excedido. Tente novamente em um minuto."},
                status_code=429,
            )
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

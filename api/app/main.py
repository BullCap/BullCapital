"""BullCapital AI Service - FastAPI Application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown actions."""
    # Startup: Ensure the database tables are created in pgvector context
    async with engine.begin() as conn:
        # Ensure 'ai' schema exists
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS ai"))
        # Create all tables programmatically
        await conn.run_sync(Base.metadata.create_all)
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

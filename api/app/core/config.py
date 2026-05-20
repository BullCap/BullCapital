"""Core configuration module."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "BullCapital AI Service"
    app_version: str = "0.0.0"
    debug: bool = False

    # API
    api_prefix: str = "/api/v1"

    # Database (pgvector for AI)
    database_url: str = (
        "postgresql+asyncpg://bullcapital_ai:bullcapital_ai_dev@localhost:5433/bullcapital_ai"
    )
    database_ssl: bool = False

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

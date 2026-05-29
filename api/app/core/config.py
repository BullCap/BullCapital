import json
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "BullCapital AI Service"
    app_version: str = "0.0.0"
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")

    # API
    api_prefix: str = "/api/v1"
    api_shared_secret: str = ""

    # Database (pgvector for AI)
    database_url: str = (
        "postgresql+asyncpg://bullcapital_ai:bullcapital_ai_dev@localhost:5433/bullcapital_ai"
    )
    database_ssl: bool = False
    database_ca_cert: str | None = None

    # Brapi
    brapi_key: str = ""

    @field_validator("brapi_key", "openai_api_key", "openrouter_api_key", "api_shared_secret", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "deepseek/deepseek-v4-flash"

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        """Return CORS origins from comma-separated or JSON env formats."""
        value = self.cors_origins.strip()
        if not value:
            return []

        if value.startswith("["):
            parsed = json.loads(value)
            return [str(origin).strip() for origin in parsed if str(origin).strip()]

        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

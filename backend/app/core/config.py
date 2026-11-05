"""Application settings. Values come from the environment / backend/.env (never committed)."""
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_prefix: str = "/api/v1"

    # Postgres (Supabase). Optional in Phase 4 so /health works without a database;
    # /ready reports the real state.
    database_url: str | None = Field(default=None, alias="DATABASE_URL")

    # Supabase Auth (used from Phase 5 for JWT verification).
    supabase_url: str | None = Field(default=None, alias="SUPABASE_URL")
    supabase_jwks_url: str | None = Field(default=None, alias="SUPABASE_JWKS_URL")
    supabase_jwt_audience: str = Field(default="authenticated", alias="SUPABASE_JWT_AUDIENCE")

    # Comma-separated list of allowed browser origins. No wildcard.
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    # Optional AI provider key (Phase 9). Never logged.
    ai_provider_api_key: str | None = Field(default=None, alias="AI_PROVIDER_API_KEY")

    @field_validator("cors_origins")
    @classmethod
    def _no_wildcard(cls, v: str) -> str:
        if "*" in v:
            raise ValueError("CORS_ORIGINS must list explicit origins; wildcard is not allowed")
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()

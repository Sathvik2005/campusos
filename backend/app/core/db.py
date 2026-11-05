"""Synchronous SQLAlchemy engine/session (ADR-08). Engine is created lazily so the app can
start (and /health respond) without a configured database."""
from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _normalise(url: str) -> str:
    # Accept postgres:// and postgresql:// and force the psycopg (v3) driver.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


@lru_cache
def get_engine() -> Engine | None:
    url = get_settings().database_url
    if not url:
        return None
    # Small pool: suits Supabase pooler and a single Render instance.
    return create_engine(_normalise(url), pool_size=5, max_overflow=5, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    engine = get_engine()
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    with sessionmaker(bind=engine, expire_on_commit=False)() as session:
        yield session


def database_status() -> dict[str, str]:
    """Real connectivity check. Never returns connection details or errors with secrets."""
    engine = get_engine()
    if engine is None:
        return {"status": "not_configured"}
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:  # noqa: BLE001 - deliberately generic; details stay in server logs
        import logging

        logging.getLogger(__name__).exception("database readiness check failed")
        return {"status": "unavailable"}

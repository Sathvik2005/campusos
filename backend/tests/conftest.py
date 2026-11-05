"""Test harness: in-memory SQLite (NOT PostgreSQL) + real RSA-signed JWTs verified by the real decode path.
Postgres-specific behaviour is not covered here; see docs/phase-5/TEST_RESULTS.md."""
import time
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import security
from app.core.config import get_settings
from app.core.db import Base
from app.core.security import get_db
from app.main import app
from app.seed import build_demo

_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_OTHER_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def make_token(sub: uuid.UUID, *, expires_in: int = 3600, aud: str | None = None, key=_KEY) -> str:
    aud = aud or get_settings().supabase_jwt_audience
    return jwt.encode({"sub": str(sub), "aud": aud, "exp": int(time.time()) + expires_in}, key, algorithm="RS256")


@pytest.fixture()
def engine():
    eng = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    @event.listens_for(eng, "connect")
    def _fk(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db(engine):
    with sessionmaker(bind=engine, expire_on_commit=False)() as session:
        yield session


@pytest.fixture()
def world(db: Session):
    """Small deterministic dataset: 200 sessions so the sample student is exactly 163/200 = 81.5%."""
    admin_id, f1, f2, f3 = (uuid.uuid4() for _ in range(4))
    data = build_demo(db, extra_students=11, sessions=200, faculty_user_ids=[f1, f2, f3], admin_user_id=admin_id)
    data.update(admin_id=admin_id, f_ids=[f1, f2, f3])
    return data


@pytest.fixture()
def client(engine, monkeypatch):
    monkeypatch.setattr(security, "resolve_signing_key", lambda token: _KEY.public_key())

    def _db():
        with sessionmaker(bind=engine, expire_on_commit=False)() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    yield TestClient(app)
    app.dependency_overrides.clear()


def auth(user_id: uuid.UUID) -> dict:
    return {"Authorization": f"Bearer {make_token(user_id)}"}

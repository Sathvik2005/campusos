"""Supabase JWT verification + authenticated user context. Identity and role come ONLY from a verified
token and the `profiles` table, never from request bodies (docs/phase-2/AUTHORIZATION_DESIGN.md)."""
import uuid
from dataclasses import dataclass
from functools import lru_cache
from typing import Callable

import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_session
from app.models import Profile

ALGORITHMS = ["RS256", "ES256"]


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    role: str
    campus_id: uuid.UUID
    faculty_id: uuid.UUID | None
    display_name: str

    @property
    def is_admin(self) -> bool:
        return self.role == "office_admin"


@lru_cache
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(url, cache_keys=True)


def resolve_signing_key(token: str):
    """Returns the public key for the token. Replaced in tests; never trusts a client-supplied key."""
    url = get_settings().supabase_jwks_url
    if not url:
        raise HTTPException(503, "Authentication is not configured")
    return _jwks_client(url).get_signing_key_from_jwt(token).key


def decode_token(token: str, key_resolver: Callable[[str], object] | None = None) -> dict:
    settings = get_settings()
    try:
        key = (key_resolver or resolve_signing_key)(token)
        return jwt.decode(token, key, algorithms=ALGORITHMS, audience=settings.supabase_jwt_audience,
                          options={"require": ["exp", "sub"]})
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired")
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")


def get_db(request: Request):
    # Indirection so tests can swap the database via app.dependency_overrides.
    yield from get_session()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> CurrentUser:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(401, "Not authenticated")
    claims = decode_token(token)
    try:
        user_id = uuid.UUID(claims["sub"])
    except ValueError:
        raise HTTPException(401, "Invalid token")
    profile = db.get(Profile, user_id)
    if profile is None:
        raise HTTPException(403, "No CampusOS profile for this account")
    return CurrentUser(profile.id, profile.role, profile.campus_id, profile.faculty_id, profile.display_name)


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not user.is_admin:
        raise HTTPException(403, "Office Admin access required")
    return user


def require_faculty(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "faculty":
        raise HTTPException(403, "Faculty access required")
    return user

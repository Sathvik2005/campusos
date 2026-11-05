"""Route-level security matrix, derived from the live route table so a new route cannot silently skip auth."""
import uuid

import pytest
from fastapi.routing import APIRoute

from app.core import security
from app.api.v1.router import api_router
from tests.conftest import auth

API = "/api/v1"
PUBLIC = {"/health", "/ready"}


def _deps(dependant):
    for d in dependant.dependencies:
        yield d.call
        yield from _deps(d)


def _api_routes():
    """Flatten the v1 router (this FastAPI version nests included routers inside app.routes)."""
    out = []
    for r in api_router.routes:
        if isinstance(r, APIRoute):
            out.append(r)
        else:
            out.extend(x for x in getattr(r, "original_router", r).routes if isinstance(x, APIRoute))
    return [type("R", (), {"path": API + x.path, "methods": x.methods, "dependant": x.dependant}) for x in out]


def _fill(path: str) -> str:
    out = path
    for part in [p for p in path.split("/") if p.startswith("{")]:
        out = out.replace(part, str(uuid.uuid4()))
    return out


def _cases():
    for r in _api_routes():
        calls = set(_deps(r.dependant))
        for m in sorted(r.methods - {"HEAD", "OPTIONS"}):
            yield pytest.param(m, r.path, security.require_admin in calls, security.require_faculty in calls, id=f"{m} {r.path}")


def test_route_table_is_not_empty():
    assert len(_api_routes()) >= 45


@pytest.mark.parametrize("method,path,admin_only,faculty_only", list(_cases()))
def test_every_api_route_rejects_anonymous_callers(client, method, path, admin_only, faculty_only):
    r = client.request(method, _fill(path), json={})
    assert r.status_code == 401, f"{method} {path} answered {r.status_code} without a token"


@pytest.mark.parametrize("method,path,admin_only,faculty_only", [c for c in _cases() if c.values[2]])
def test_admin_only_routes_reject_faculty(client, world, method, path, admin_only, faculty_only):
    r = client.request(method, _fill(path), headers=auth(world["f_ids"][0]), json={})
    assert r.status_code == 403, f"{method} {path} answered {r.status_code} for faculty"


@pytest.mark.parametrize("method,path,admin_only,faculty_only", [c for c in _cases() if c.values[3]])
def test_faculty_only_routes_reject_admin(client, world, method, path, admin_only, faculty_only):
    r = client.request(method, _fill(path), headers=auth(world["admin_id"]), json={})
    assert r.status_code == 403, f"{method} {path} answered {r.status_code} for admin"


def test_cors_allows_only_configured_origins(client):
    ok = client.options("/api/v1/me", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
    bad = client.options("/api/v1/me", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers
    assert "access-control-allow-credentials" not in ok.headers


def test_public_endpoints_expose_no_secrets(client):
    for p in PUBLIC:
        body = client.get(p).text.lower()
        assert not any(w in body for w in ("password", "secret", "service_role", "api_key", "postgres://"))


def test_sql_metacharacters_in_search_are_inert(client, world):
    h = auth(world["admin_id"])
    r = client.get(f"{API}/students", headers=h, params={"q": "x' OR '1'='1"})
    assert r.status_code == 200 and r.json()["total"] == 0
    r = client.get(f"{API}/students", headers=h, params={"q": "%"})
    assert r.status_code == 200      # LIKE wildcard is treated as data, no error

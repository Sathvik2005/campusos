from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_ready_reports_unconfigured_database_honestly(monkeypatch):
    monkeypatch.setattr("app.api.health.database_status", lambda: {"status": "not_configured"})
    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json() == {"status": "degraded", "database": "not_configured"}


def test_ready_503_when_database_unavailable(monkeypatch):
    monkeypatch.setattr("app.api.health.database_status", lambda: {"status": "unavailable"})
    assert client.get("/ready").status_code == 503


def test_cors_allows_configured_origin_only():
    ok = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    bad = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in bad.headers


def test_unknown_route_uses_error_envelope():
    r = client.get("/nope")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "http_404"

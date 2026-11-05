from fastapi import APIRouter, Response

from app.core.db import database_status

router = APIRouter(tags=["platform"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness: the process is up."""
    return {"status": "ok"}


@router.get("/ready")
def ready(response: Response) -> dict:
    """Readiness: reports real database state. 503 when the database is configured but unreachable."""
    db = database_status()
    if db["status"] == "unavailable":
        response.status_code = 503
    return {"status": "ready" if db["status"] == "ok" else "degraded", "database": db["status"]}

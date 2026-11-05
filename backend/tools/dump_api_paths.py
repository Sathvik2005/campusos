"""Writes the backend's real route list (method + path) to frontend/lib/api/api-paths.json.

The frontend test `lib/api/api-contract.test.ts` checks every /api/v1 path used in the UI against this file, and
`backend/tests/test_api_paths_snapshot.py` fails if the file is stale. Run from backend/:  python -m tools.dump_api_paths
"""
import json
import pathlib

from app.main import app

TARGET = pathlib.Path(__file__).resolve().parents[2] / "frontend" / "lib" / "api" / "api-paths.json"


def current() -> list[str]:
    spec = app.openapi()
    return sorted(f"{m.upper()} {p}" for p, ops in spec["paths"].items() if p.startswith("/api/v1") for m in ops)


if __name__ == "__main__":
    TARGET.write_text(json.dumps(current(), indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(current())} routes to {TARGET}")

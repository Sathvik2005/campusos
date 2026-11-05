"""LOCAL DEMO / SCREENSHOT TOOL. Never used in production.

Starts the real FastAPI app on a SQLite file with a *local* RS256 test issuer, so the app can be run and
photographed without a Supabase project. Tokens are still fully verified by the application (signature,
audience, expiry, profile lookup, role checks); only the source of the public key differs from production.

Guards: refuses unless DATABASE_URL is SQLite and APP_ENV is not production. The key is generated in memory
at every start and is never written to disk. Prints no secrets.

Usage (from backend/, with the venv):
  set DATABASE_URL=sqlite:///E:/tmp/localdemo.db
  python -m alembic upgrade head
  python -m app.seed --i-understand-this-writes-demo-data --admin-user-id <uuid> --faculty-user-id <uuid> ...
  set LOCAL_DEMO_SUBS=admin=<uuid>,faculty1=<uuid>
  set LOCAL_DEMO_TOKENS_FILE=E:/tmp/demo-tokens.json
  python -m tools.local_demo_server
"""
import json
import os
import sys
import time

import jwt
import uvicorn
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core import security
from app.core.config import get_settings


def main() -> int:
    settings = get_settings()
    if settings.is_production or not (settings.database_url or "").startswith("sqlite"):
        print("Refusing to start: the local demo server needs APP_ENV != production and a SQLite DATABASE_URL.")
        return 2
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    security.resolve_signing_key = lambda token: key.public_key()

    subs = dict(p.split("=", 1) for p in os.environ.get("LOCAL_DEMO_SUBS", "").split(",") if "=" in p)
    out = os.environ.get("LOCAL_DEMO_TOKENS_FILE")
    if out and subs:
        exp = int(time.time()) + 8 * 3600
        tokens = {
            name: jwt.encode({"sub": sub, "aud": settings.supabase_jwt_audience, "exp": exp}, key, algorithm="RS256")
            for name, sub in subs.items()
        }
        with open(out, "w", encoding="utf-8") as f:
            json.dump({"subs": subs, "tokens": tokens, "expires_at": exp}, f)

    from app.main import app

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")), log_level="warning")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Local environment setup

Prereqs: Node 24, Python 3.11+ (docs target 3.12), Git. Windows paths shown; works the same elsewhere.

```
# backend
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env            # then fill in DATABASE_URL, SUPABASE_*, CORS_ORIGINS (never commit)
.venv\Scripts\python -m alembic upgrade head      # against your DEV database only
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# frontend
cd frontend
npm install
copy .env.example .env.local      # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 plus Supabase public values
npm run dev                        # http://localhost:3000
```
Without Supabase values the app still starts: the login page says sign-in is not configured and `/ready` reports `database: not_configured`.

Tests: `cd backend; .venv\Scripts\python -m pytest -q` | `cd frontend; npm test; npm run typecheck; npm run lint; npm run build; npm run test:e2e -- --workers=1`.
Low-memory machines: Vitest is configured with `fileParallelism: false`; set `NODE_OPTIONS=--max-old-space-size=512`.
Demo data: `python -m app.seed` creates synthetic CSE data including Subhashree Mohanty (ENG-24-CSE-0412). **Run it only against a local/dev database, never production.**

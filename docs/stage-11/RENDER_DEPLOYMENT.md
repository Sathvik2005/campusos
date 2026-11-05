# Render deployment (backend)

Blueprint: `render.yaml` at the repo root (service `campusos-api`, root dir `backend`, free plan; change the plan if you want always-on).
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/health` (liveness). `/ready` additionally reports database state.
- Python: `PYTHON_VERSION=3.11.9` (the version the tests ran on; the docs target 3.12 once launchers are fixed).
- `APP_ENV=production` (hides API docs). Secrets (`DATABASE_URL`, `SUPABASE_*`, `AI_PROVIDER_API_KEY`) are `sync: false`: enter them in the dashboard, never in Git.
- `CORS_ORIGINS` must be the exact Vercel production (and any approved preview) origin(s); no wildcard.
- Migrations are NOT run by Render (see migration plan).
Logging: structured to stdout (Render captures it). No monitoring/alerting is configured.
Free-plan note: the service sleeps when idle, so the first request after a pause is slow; this does not affect offline attendance because rosters are cached and writes queue locally.
Status: service not created (owner action).

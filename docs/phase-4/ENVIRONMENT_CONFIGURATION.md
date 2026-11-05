# Phase 4 — Environment configuration

Names are taken from the code (`backend/app/core/config.py`, `frontend/lib/env.ts`). Values are supplied by the owner and never committed. `backend/.env` and `frontend/.env.local` are git-ignored; only `.env.example` files are tracked.

| Variable | App | Required now | Public? | Purpose / where to get it |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | frontend | yes | public | FastAPI base URL, e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | frontend | Phase 6 | public | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | frontend | Phase 6 | public (anon key only) | Supabase Project Settings → API |
| `APP_ENV` | backend | no (default `development`) | secret config | `production` disables `/docs` and `/openapi.json` |
| `LOG_LEVEL` | backend | no (default `INFO`) | — | Python log level |
| `DATABASE_URL` | backend | for `/ready` = ok, Alembic | **secret** | Supabase Project Settings → Database; accepts `postgres://` or `postgresql://`, driver forced to psycopg |
| `SUPABASE_URL` | backend | Phase 5 | — | Project URL |
| `SUPABASE_JWKS_URL` | backend | Phase 5 | — | JWKS endpoint for verifying access tokens |
| `SUPABASE_JWT_AUDIENCE` | backend | no (default `authenticated`) | — | Expected `aud` claim |
| `CORS_ORIGINS` | backend | no (default `http://localhost:3000`) | — | Comma-separated explicit origins; wildcard rejected at startup |
| `AI_PROVIDER_API_KEY` | backend | optional (Phase 9) | **secret** | AI explanations are disabled when empty |

Rules: never put a Supabase service-role key anywhere in the frontend; the app does not use it. Do not print or log values; configuration errors name variables only. Keep local, preview and production values separate.

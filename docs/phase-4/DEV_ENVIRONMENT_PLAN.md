# CampusOS — Phase 4: Development environment plan

**Objective:** empty but runnable skeleton. No features. Starts only when the owner says "start the development environment".
Layout per ADR-06: `frontend/` and `backend/` at repo root (supersedes `apps/web` / `apps/api` in the Phase 0 plan).

## 1. Scope
| Item | Detail |
| --- | --- |
| Repo | This folder currently sits inside a larger parent git repo. Decide with the owner whether to `git init` here or publish it as its own public GitHub repo. Never rewrite existing history |
| `frontend/` | Next.js App Router + TypeScript + Tailwind + shadcn/ui; one placeholder page; Vitest + Playwright configured |
| `backend/` | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic (empty baseline), Pytest + HTTPX; `GET /health`, `GET /ready` |
| Env | `frontend/.env.example`, `backend/.env.example`; real files gitignored; startup validation of required names without printing values |
| Local DB | Owner chooses: a dev Supabase project (never the production one) or local Postgres via optional `docker-compose.yml` |
| CI stub | `.github/workflows/ci.yml`: backend lint + pytest, frontend lint + typecheck + vitest. No deploy |
| README | How to run the two processes; only commands actually verified |

## 2. Env variable names (proposed; finalise from code, do not invent later)
- Frontend (public): `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Backend (secret): `DATABASE_URL`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`, `CORS_ALLOWED_ORIGINS`, `AI_API_KEY` (optional), `APP_ENV`
- The Supabase service-role key is not used by the app.

## 3. Rules
- The owner enters credentials; the assistant never creates, overwrites or prints `.env*`.
- Pin versions in lockfiles; record verified versions in the README.
- No feature code, no seed data, no migrations beyond an empty baseline.

## 4. Exit criteria
1. `uvicorn app.main:app` serves `/health` with 200.
2. `npm run dev` renders the placeholder page.
3. `pytest` and `npm test` run (smoke tests only) and pass.
4. `.gitignore` proven to exclude `.env*`, `node_modules`, `.venv`.
5. CI stub commands pass locally.

## 5. Approval gates
Owner approval before: creating a GitHub repo or remote, any push, connecting a Supabase project.

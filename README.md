# CampusOS

**Campus life, in sync.**

An offline-first academic operations workspace for a single campus programme (B.Tech CSE; Faculty + Office Admin). Built as the Isocode Labs Software Engineering Intern take-home for Company A, Bhubaneswar.

> Product promise: campus operations continue, even when the internet doesn't.

## Status

Foundation (Phase 4) only: a runnable Next.js app and FastAPI service that talk to each other. **No ERP features are implemented yet.** Live progress: [`docs/STATUS.md`](docs/STATUS.md). No deployment exists yet; there are no live URLs.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · TanStack Query · React Hook Form · Zod · Dexie (offline, later phases) → FastAPI · Pydantic v2 · SQLAlchemy 2 · Alembic → PostgreSQL (Supabase). Auth: Supabase Auth JWTs verified by FastAPI. Tests: Pytest, Vitest, Playwright. Planned hosting: Vercel + Render + Supabase.

Verified versions on the development machine: Node 26.2.0, npm 11.13.0, Python 3.11.9 (docs target 3.12; not available here), Next.js 16.4.4, React 19.3.0, FastAPI 0.162.0, SQLAlchemy 2.1.6.

## Repository layout

```
frontend/   Next.js app
backend/    FastAPI app, Alembic, tests
docs/       Phase documents (source of truth); docs/STATUS.md tracks progress
```

## Run locally

Prerequisites: Git, Node 20+ and npm, Python 3.11+.

**Backend** (PowerShell):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # then edit; leave DATABASE_URL empty to run without a database
uvicorn app.main:app --reload
```

API: http://localhost:8000 · Swagger: http://localhost:8000/docs · `GET /health`, `GET /ready` (reports real database state: `ok`, `not_configured`, `unavailable`).

**Frontend**:

```powershell
cd frontend
npm install
copy .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

App: http://localhost:3000 — the Overview page shows a live indicator driven by a real request to the API.

## Tests and checks

| What | Command (from the folder) |
| --- | --- |
| Backend tests | `cd backend; .venv\Scripts\python -m pytest -q` |
| Frontend unit tests | `cd frontend; npm test` |
| Frontend typecheck / lint / build | `npm run typecheck` / `npm run lint` / `npm run build` |
| Browser tests (starts both servers; uses system Edge) | `cd frontend; npm run test:e2e` |

## Configuration

Real credentials stay in `backend/.env` and `frontend/.env.local` (both git-ignored). Variable names and where to get values: [`docs/phase-4/ENVIRONMENT_CONFIGURATION.md`](docs/phase-4/ENVIRONMENT_CONFIGURATION.md). Never use a production database locally, and never run migrations or seeds against a database that holds real data without explicit approval.

## Docs

Start with [`docs/phase-0/PROJECT_CONTEXT.md`](docs/phase-0/PROJECT_CONTEXT.md), then phases 1–3 (product, architecture, UI/UX) and the per-phase plans in `docs/phase-4` … `docs/phase-12`. Setup details: [`docs/phase-4/SETUP_GUIDE.md`](docs/phase-4/SETUP_GUIDE.md). Engineering rules for coding agents: [`CLAUDE.md`](CLAUDE.md).

Note: the root `docs/ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `IMPLEMENTATION_PLAN.md` and `PHASES_SUMMARY.md` describe an earlier plan and are superseded by `docs/phase-0` … `phase-12`.

## Scope (v1)

Included: one campus, B.Tech CSE, Faculty + Office Admin, academic masters, student directory, offline attendance with sync, internal marks with moderation and locking, simulated fees and receipts, explainable risk flags. Excluded: multi-campus rollout, admissions, parent portal, payroll, real payment gateways, SMS/WhatsApp, university integrations. Payments are simulated; dashboard numbers are prototype data, not client KPIs.

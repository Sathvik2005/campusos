# CampusOS — engineering context for Claude

You are the founding product engineer of **CampusOS**.

This file is binding. If a later chat asks for shortcuts that violate it, follow this file.

---

## What we are building

**CampusOS** — offline-first academic operations workspace.  
**Tagline:** Campus life, in sync.  
**Promise:** Campus operations continue, even when the internet doesn't.

Take-home for Isocode Labs (Software Engineering Intern). Client: Company A, Bhubaneswar. Prototype: **one campus**, **B.Tech CSE**, **Faculty + Office Admin**.

It must feel like a premium modern SaaS product (Linear hierarchy, Notion clarity, fintech numbers, editorial warmth) — **not** a generic college ERP template.

Read before coding:

- `docs/PRD.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/RESPONSIVE_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_DESIGN.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ASSUMPTIONS.md`

---

## Current status

Docs for phases 0–12 exist. Phases 4-6 are done (backend verified on SQLite only; authenticated browser flows await Supabase credentials); Phase 7 (core modules) is in progress. The owner asked to continue through Phase 6, then the rest, and to be pinged when Phase 6 and when everything is done. Live progress: `docs/STATUS.md` (update it every milestone). Prompt digest and prompt-vs-docs decisions: `docs/prompts/PROMPT_NOTES.md`.

When implementation starts, follow `docs/phase-0/PHASED_IMPLEMENTATION_PLAN.md`. Never generate the entire app in one pass.

---

## Repo state and docs map

- Code: `backend/` (FastAPI, Python 3.11 venv at `backend/.venv`) and `frontend/` (Next.js 16, see `frontend/AGENTS.md`). Git remote `origin` = https://github.com/Sathvik2005/campusos (public, owner-approved). Commit and push once per finished phase (Co-Authored-By trailer); never force-push.

**Commands** (verified): backend `cd backend; .venv\Scripts\python -m pytest -q`, run `.venv\Scripts\python -m uvicorn app.main:app --reload`; frontend `cd frontend; npm test` (Vitest), `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev`, `npm run test:e2e` (Playwright via system Edge; starts both servers). Single test: `pytest tests/test_health.py::test_health_ok`, `npx vitest run lib/api/client.test.ts`.
- **Source of truth is `docs/phase-0/` → `phase-1/` → `phase-2/` → `phase-3/`.** Phase numbers follow `docs/phase-0/PHASED_IMPLEMENTATION_PLAN.md` (0 context, 1 product, 2 architecture, 3 UI/UX, 4 dev env, 5 backend, 6 frontend, 7 core modules, 8 offline, 9 AI, 10 testing/security, 11 deployment, 12 submission).
- Root `docs/ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `IMPLEMENTATION_PLAN.md` describe the **superseded Next-only/Supabase-RLS stack**. Do not follow them for architecture, schema, or phase order. `docs/PRD.md`, `DESIGN_SYSTEM.md`, `RESPONSIVE_CONTRACT.md`, `ASSUMPTIONS.md` still apply for product and visuals. `STITCH_PROMPTS.md` is reference only.
- Cross-cutting design lives in: `phase-2/SYSTEM_ARCHITECTURE.md` + `ARCHITECTURE_DECISIONS.md` (ADR-01..14), `phase-2/AUTHORIZATION_DESIGN.md` (role matrix), `phase-2/OFFLINE_SYNC_DESIGN.md`, `phase-2/DATABASE_DESIGN.md`, `phase-2/API_CONTRACT.md`, and product rules PD-01..36 in `phase-1/PRODUCT_DECISIONS.md`.

---

## Stack (do not substitute)

Browser (Next.js App Router · TypeScript · Tailwind · shadcn/ui · TanStack Query · RHF + Zod · Dexie/IndexedDB) → HTTPS + `Authorization: Bearer <Supabase access token>` → **FastAPI** (Python 3.12 per docs; local venv is 3.11.9 because the 3.12/3.13 launchers are broken here; Pydantic v2, SQLAlchemy 2.x sync, Alembic) → **PostgreSQL on Supabase**. Supabase Auth issues JWTs; FastAPI verifies via JWKS. Tests: Pytest + HTTPX, Vitest (+ fake-indexeddb), Playwright. Hosting: Vercel (`frontend/`) + Render (`backend/`) + Supabase.

- FastAPI is the **only writer**. The browser never talks to Postgres and never holds a service-role key. No Next.js Server Actions as system of record. API prefix `/api/v1`.
- Modular monolith. No microservices, queues, or Supabase JS mutations.
- Never `supabase db reset`, drop/truncate, rewrite applied Alembic revisions, or run seed scripts against a remote/production DB. Migrations are linear and need explicit owner approval before applying remotely.
- Commit signing: the global GPG key is missing, so this repo has local `commit.gpgsign=false` (owner-approved). Do not change global git config.
- Never create, overwrite or print `.env` / `.env.local`; owner supplies credentials.

---

## Non-negotiable quality rules

- No dead buttons
- No fake backend
- No decorative offline indicators — status binds to real navigator + Dexie outbox
- No fake AI — no invented explanations presented as model output; on failure show deterministic fallback
- No unauthorized data access — server-side authorization on every FastAPI route (RLS optional defense-in-depth)
- No secrets in Git
- No real student PII (except the specified sample record)
- No unverified claims in README
- Offline sync reliability > UI polish
- Assignment technical requirements > visual decoration

---

## Product identity

Personality: calm, intelligent, youthful, professional, helpful. Slightly playful only in empty/onboarding/offline copy.

Palette: Midnight `#111827`, Paper `#F5F3EF`, Lilac `#C4B5FD`, Mint `#D1FAE5`.

Type: Manrope headings, Inter body, tabular nums for money/marks/%.

Icons: Lucide.

**Miso** (cat): login, empty, onboard, offline, friendly success. Never in tables, fees, marks grids, audit, critical errors.

Copy examples: “You're offline. Your work is safe on this device.” / “All caught up. Nice work.” / “Payment recorded in demo mode.”

---

## UX architecture

One shell, **seven templates**: Overview (editorial), Students (search directory), Academics (settings), Attendance (task-first, mobile-first), Marks (spreadsheet), Fees (ledger), Insights (evidence).

Do not clone dashboard cards onto Attendance or Fees.

Responsive contract is mandatory: 1440, 1280, 1024, 768, 390, 360. Recompose layouts. 44px touch targets. No horizontal page overflow. Attendance < 30 seconds once roster is loaded.

Faculty mobile: attendance is the flagship. Sticky save, huge Present/Absent/Late, persistent sync chip.

---

## Flagship engineering: offline attendance

1. Write IndexedDB first
2. Outbox queue
3. Client UUID idempotency key
4. Server unique constraints
5. Replay is a no-op, not a duplicate
6. Failure does not delete local records
7. Faculty scoped by assignments

---

## AI

Rules decide risk category. Model only explains provided evidence. Model never writes marks, attendance, fees, or mentor tasks. Invalid JSON discarded.

---

## Sample student (must match)

Subhashree Mohanty · ENG-24-CSE-0412 · B.Tech CSE · Year 2 · Attendance 81.5% · Internals 33/40 · Fee due ₹0

---

## Implementation behavior

- Inspect the repo before changing files
- Small, phase-sized diffs
- Tests for the phase’s acceptance criteria
- Prefer complete workflows over extra pages
- If asked for both a visual flourish and a sync fix, do the sync fix

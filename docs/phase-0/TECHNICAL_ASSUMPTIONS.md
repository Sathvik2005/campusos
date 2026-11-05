# CampusOS — Phase 0: Technical assumptions and constraints

Proposed stack for a **meaningful full-stack** intern project. These are defaults for architecture review, **not permission to install packages yet**.

---

## 1. Recommended architecture (pending approval)

```
[ Browser: Next.js + Dexie ]
        HTTPS / JWT
        │
        ▼
[ Render: FastAPI ]
        SQLAlchemy + Alembic
        │
        ▼
[ Supabase: PostgreSQL ]
```

| Concern | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js (App Router) + **TypeScript** + Tailwind + shadcn/ui | App Router still useful for routing, fonts, and Vercel; TS over JS for API contracts |
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x | Explicit REST, testable domain, intern-evaluable Python |
| DB | PostgreSQL on Supabase | Managed Postgres; we use it as a **database**, not as the application server |
| Auth | FastAPI-issued JWT (access + refresh) stored in **httpOnly cookies** or memory+refresh — **default: httpOnly cookies** | Permissions live in Python dependencies, not in RLS-only client access |
| Offline | Dexie.js / IndexedDB attendance outbox | Product identity |
| Tests | Pytest (API + domain), Vitest (client domain/offline), Playwright (journeys + viewports) | Matches the new roadmap |
| Front deploy | Vercel | Next.js native |
| Back deploy | Render (Web Service) | Python process, health check `/health` |
| VCS | Public GitHub, incremental commits | Assignment requirement |

**Rejected for MVP (unless you override):** Next.js Server Actions as the system of record, Supabase Auth as the only IdP, client using the service role, microservices, message queues.

---

## 2. How this differs from existing `docs/ARCHITECTURE.md`

| Earlier doc | This Phase 0 |
| --- | --- |
| Next talks to Postgres via Supabase client + RLS | Next talks **only** to FastAPI |
| Auth = Supabase Auth | Auth = FastAPI (password hash in DB or verified against a users table) |
| Sync POST could hit Next route handlers | Sync POST hits `POST /v1/attendance/sync` |
| AI in Next server | AI in FastAPI service, key only on Render |

Supabase **may** still provide the Postgres instance, SQL editor, backups, and (optional) dashboard. Row Level Security can be layered as defense-in-depth **later**; MVP gate is **FastAPI + a least-privilege DB role** used by the API. The Next.js anon key must not be able to mutate academic tables.

---

## 3. Proposed repository structure (monorepo)

```
campusos/
  apps/web/                 # Next.js frontend
    src/app/
    src/components/
    src/lib/api/
    src/lib/offline/
    public/miso/
  apps/api/                 # FastAPI backend
    app/main.py
    app/api/v1/
    app/core/               # config, security, deps
    app/models/
    app/schemas/
    app/services/           # attendance sync, marks, fees, risk
    app/ai/
    alembic/
    tests/
  packages/                 # optional shared OpenAPI types later
  docs/
    phase-0/                # this folder
    ...existing design/PRD
  .github/workflows/
  README.md
```

Until Phase 4, this tree is **proposed**, not created.

Alternative if you prefer flatter layout: `/frontend` + `/backend` at repo root. Same boundaries.

---

## 4. API shape (assumptions)

- Prefix `/v1`
- JSON only  
- Errors: `{ "error": { "code", "message", "details?" } }`  
- Pagination: `limit`, `cursor` or `offset` (default offset for MVP directory)  
- Idempotency: header `Idempotency-Key` **and/or** body `idempotency_key` on attendance sync and payments  
- CORS: allow Vercel origin + localhost; credentials if cookies  
- OpenAPI generated from FastAPI (`/docs` disabled or protected in production)

Suggested resource groups: `/auth`, `/me`, `/masters`, `/students`, `/attendance`, `/marks`, `/fees`, `/insights`, `/tasks`.

---

## 5. Data and domain assumptions

| Topic | Default if you do not change it |
| --- | --- |
| Timezone | Asia/Kolkata |
| Currency | INR, tabular numerals |
| Programme | B.Tech CSE only |
| Batch | Year 2, one section |
| Seed size | ~48–80 fictional students + Subhashree |
| IA components | IA-1 + IA-2, combined max 40 |
| Shortage | Attendance **< 75%** flags shortage / watch |
| Stronger risk | Attendance **< 65%** and/or internals **< 40% of max** → at_risk |
| Late | Stored status; no extra penalty math in MVP |
| Payments | `kind = simulated` always; amount `> 0` and `≤ outstanding` |
| AI | One provider via `AI_API_KEY`; timeout ~8s; Zod/Pydantic schema; fail open to rules |
| Migrations | Alembic in `apps/api`, applied on Render release command |

Relational sketch in `docs/DATABASE_DESIGN.md` remains the starting schema (sessions, records, marks_audit, fee_payments unique keys). FastAPI services own writes.

---

## 6. Offline sync contract (engineering)

1. Roster fetched while online is cached (IndexedDB).  
2. Marks write to Dexie **before** network.  
3. Outbox holds session payload + UUID idempotency key.  
4. FastAPI upserts on `idempotency_key` and natural key `(batch, subject, date, period)`.  
5. Duplicate replay returns the existing session (success, not 500).  
6. Conflict (two different payloads for same natural key from different keys): **visible failure**, local retained, Admin/Faculty can retry or inspect — default: last-write-wins **only if** the same faculty and same key; otherwise 409 with body, UI shows “Sync failed — this period already exists”.  
7. Never delete local outbox on 5xx.

---

## 7. Security constraints

- No secrets in Git; `.env.example` with empty values  
- Password hashing: Argon2 or bcrypt  
- Faculty assignment checks on every attendance/marks write  
- Pydantic validation on all bodies  
- Audit rows for marks lifecycle and admin score edits  
- AI payload: roll, aggregates, evidence JSON — no extra PII  
- Rate-limit login (simple) in production  
- HTTPS only in deploy  
- DPDP: minimise, synthetic data, **no compliance badge**

---

## 8. Environment variables (names only — not values)

Frontend (Vercel): `NEXT_PUBLIC_API_URL`

Backend (Render): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `AI_API_KEY` (optional), `SEED_ON_START` (false in prod after first seed)

Never `NEXT_PUBLIC_` for secrets.

---

## 9. Testing and quality constraints

- Pytest for fee math, mark max, risk rules, sync idempotency, RBAC  
- Vitest for Dexie queue helpers  
- Playwright: login, offline attendance, lock marks, mock payment; viewports 1440 and 390  
- No decorative endpoints  

---

## 10. Hosting assumptions we can revisit

Render’s free/sleeping tier can delay first API request. If that hurts the demo, alternatives: Fly.io, Railway, or a Vercel Python runtime **only if** FastAPI still remains a separate service conceptually. Decision: **Render unless sleep becomes a demo risk**, then Railway.

---

## 11. Clarifying questions (need your call, or accept defaults)

See the summary in the chat; repeated here for the record:

| ID | Question | Default |
| --- | --- | --- |
| Q-01 | TypeScript or JavaScript on the frontend? | **TypeScript** |
| Q-02 | JWT cookies vs `Authorization: Bearer` in localStorage? | **httpOnly cookies** |
| Q-03 | Keep Supabase Auth in addition to FastAPI? | **No — FastAPI only** |
| Q-04 | Enable Postgres RLS anyway? | **Phase 10 optional**, not blocking |
| Q-05 | Monorepo `apps/web` + `apps/api` vs `/frontend` `/backend`? | **`apps/*`** |
| Q-06 | Student role in MVP? | **No** |
| Q-07 | Conflict policy when two devices save the same period differently? | **409 + keep local; no silent merge** |
| Q-08 | AI vendor? | OpenAI-compatible env, skip if key missing |
| Q-09 | Public GitHub now or at Phase 4? | **Phase 4** |
| Q-10 | Reconcile/overwrite old `ARCHITECTURE.md` in Phase 2? | **Yes, in Phase 2, not now** |

# CampusOS — Phase 2: Architecture decisions

Locked for implementation. Product rules stay in `docs/phase-1/PRODUCT_DECISIONS.md`.

| ID | Decision | Why |
| --- | --- | --- |
| ADR-01 | **Split stack:** `frontend/` Next.js + `backend/` FastAPI | Full-stack intern evaluation; UI never writes Postgres |
| ADR-02 | **DB access:** SQLAlchemy 2.x + Alembic only | One writer. No Supabase JS mutations |
| ADR-03 | **Auth:** Supabase Auth issues JWTs; FastAPI verifies via JWKS | Matches assignment hosting; identity not from request body |
| ADR-04 | **AuthZ:** FastAPI dependencies on every protected route | Frontend nav is not security |
| ADR-05 | **RLS:** optional defense-in-depth later; not the primary gate | API uses a single DB role with least privilege |
| ADR-06 | **Repo layout:** `frontend/` and `backend/` at repo root | Matches Phase 4 prompt |
| ADR-07 | **API prefix:** `/api/v1` | Consistent with later phases |
| ADR-08 | **DB style:** sync SQLAlchemy + FastAPI (threadpool) unless we hit blocking; document if switching to async | Simpler Pytest; CampusOS is CRUD not WS-heavy |
| ADR-09 | **Offline:** Dexie outbox → `POST /api/v1/attendance/sync` | Idempotency keys + unique natural session |
| ADR-10 | **Conflicts:** 409, keep local, no silent merge | Phase 0 Q-07 / PD-10 |
| ADR-11 | **AI:** rules in Python; LLM explanation optional | Fail open to rules |
| ADR-12 | **Host:** Vercel + Render + Supabase Postgres | Clear split |
| ADR-13 | **Cookies vs Bearer:** Frontend sends `Authorization: Bearer <supabase access_token>` | Simpler CORS with Vercel↔Render than cookie cross-site |
| ADR-14 | **No Next.js Server Actions as system of record** | All writes go FastAPI |

Supersedes root `docs/ARCHITECTURE.md` (Next-only) when coding.

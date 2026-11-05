# CampusOS — Phase 5: Backend development plan

**Objective:** auth, permissions, models, migrations, services and tests, usable from Swagger without any UI. Contract: `phase-2/API_CONTRACT.md`, `DATABASE_DESIGN.md`, `AUTHORIZATION_DESIGN.md`, `OFFLINE_SYNC_DESIGN.md`. Rules: PD-01..36 in `phase-1/PRODUCT_DECISIONS.md`.

## 1. Build order (small reviewable diffs; each step ends with passing tests)
| Step | Work | Key tests |
| --- | --- | --- |
| 5.1 | Config, DB session, error envelope, request-id logging (no secrets or PII) | startup fails clearly on missing env |
| 5.2 | JWT verification via JWKS (`iss`, `aud`, `exp`, signature), `profiles` lookup, `/auth/me`, role dependencies | 401 expired/forged, 403 no profile, role read from DB not body |
| 5.3 | Alembic baseline + models for all tables in `phase-2/DATABASE_DESIGN.md`, including unique/check constraints and the marks `score <= max` trigger | migration applies on a clean DB; constraint violations |
| 5.4 | Masters + assignments (Admin write, Faculty scoped read) | 403 matrix, duplicate → 409 |
| 5.5 | Students list/detail/create/edit; computed attendance % (PD-03) and internals; fee block Admin-only | Faculty never receives fee fields; search and pagination |
| 5.6 | Attendance roster, sessions, `/attendance/sync`, correction + audit | replay is a no-op; same key with other payload 409; natural-key 409; incomplete roster 422; unassigned 403 |
| 5.7 | Marks lifecycle draft→submitted→moderated→locked, unlock with reason, audit | locked write rejected; max/negative rejected; Faculty cannot moderate |
| 5.8 | Fees accounts, simulated payments (idempotent), receipts, Decimal math | partial pay; overpay 422; replay returns same receipt |
| 5.9 | Risk rules engine + `risk_assessments`, mentor tasks, audit read, `/overview` | boundaries at 65 and 75; missing data → `insufficient` |
| 5.10 | AI explanation adapter (provider-agnostic, timeout, JSON-schema validation) | no key / timeout / malformed → `unavailable`, rules intact; adapter has no write path |
| 5.11 | Dev-only seed script (refuses to run when `APP_ENV=production`) | Subhashree exact: 81.5% / 33/40 / ₹0 |

## 2. Cross-cutting requirements
- Every protected route has an explicit dependency; out-of-scope objects return 404.
- All writes run in transactions; audit rows are written in the same transaction.
- `campus_id` filter on every query. Schemas never accept `role`, `user_id` or `campus_id` from clients.
- Sync SQLAlchemy per ADR-08.
- Seed attendance, marks and fees are crafted so the sample student's official numbers match exactly; a test asserts it.

## 3. Exit criteria
- `/docs` shows only the contract's endpoints.
- Faculty 403 matrix green; idempotency, replay and conflict tests green.
- Migrations apply cleanly to an empty dev DB with linear history.
- Seed produces the exact sample student.
- Report PASS / FAIL / NOT TESTED per area; nothing marked passed without a test run.

## 4. Approval gates
Applying migrations or seed to any remote Supabase DB requires owner approval (Phase 11 process). Phase 5 uses a local or dev database only.

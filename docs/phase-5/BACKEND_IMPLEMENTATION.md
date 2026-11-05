# Phase 5 — Backend implementation

Date: 2026-11-02. Python 3.11.9, FastAPI 0.162.0, SQLAlchemy 2.1.6 (sync, ADR-08), Alembic 1.20.1, Pydantic 2.14.2, PyJWT 2.15.1.

## Layout (`backend/app`)
| Path | Responsibility |
| --- | --- |
| `core/` | settings, logging, lazy DB engine, error envelope, `security.py` (JWT verification, `CurrentUser`, role dependencies) |
| `models/entities.py` | all 21 tables from `docs/phase-2/DATABASE_DESIGN.md` (+ `campus_id` on students/batches, `payload_hash` on attendance sessions) |
| `schemas/api.py` | request/response models; requests use `extra="forbid"` (no mass assignment) and never carry role/campus/user ids |
| `services/` | business rules: `attendance` (sync, correction), `marks` (lifecycle), `fees` (simulated payments), `risk` (rules engine), `insights` (assessments, mentor tasks), `stats` (official numbers), `audit` |
| `ai/explainer.py` | optional explanation boundary: no DB access, PII-free payload, schema-validated output, fails closed |
| `api/v1/endpoints/` | HTTP layer, one module per group; `router.py` mounts under `/api/v1` |
| `seed.py` | dev-only synthetic data incl. the exact sample student |
| `alembic/versions/0001_initial_schema.py` | initial schema |

Deviation: no separate `repositories/` layer; services query SQLAlchemy directly. Revisit only if it hurts testability.

## Key behaviours
- **Auth:** token verified with the Supabase JWKS (`RS256/ES256`, `aud`, `exp`, signature); `sub` → `profiles` row → role/campus/faculty. No profile → 403. Role is never read from a body.
- **Scoping:** every query filters `campus_id`; Faculty are limited to assigned subject+batch; out-of-scope object ids return 404, not 403.
- **Attendance sync:** requires a complete roster; same key + same payload → 200 existing, same key + different payload → 409, same class/date/period under a new key → 409, unique constraints are the backstop (race → rollback → re-resolve).
- **Marks:** draft → submitted → moderated → locked; locked rejects writes from everyone; unlock needs a reason and returns to `moderated`; admin score changes need a reason; all changes audited.
- **Fees:** amounts are `Decimal`/`numeric(12,2)`; payments are always `simulated`; idempotent replay returns the original and receipt; overpay rejected.
- **Risk:** thresholds 75 / 65 / 40% of max (PD-04/05), `rules-v1`; reasons preserved per indicator; missing data reported as limited/insufficient.
- **AI:** no provider is wired (owner decision), so explanations report `unavailable` today. The validation/fail-closed pipeline is implemented and tested with fake providers.

## Seed
`python -m app.seed --i-understand-this-writes-demo-data` (dev DB only). Refuses if `APP_ENV=production`, if the DB already has students, or without the flag. Creates 1 campus, CSE, 6 subjects, 3 faculty, 41 students, 200 attendance sessions, IA-1/IA-2 (locked), fee plan and payments. Sample student: attendance 163/200 = 81.5%, internals 33/40, fee due 0.00 (asserted by a test). Auth profiles are created only when real Supabase user ids are provided; none exist yet.

## Not done / limits
See `TEST_RESULTS.md` and `SECURITY_REVIEW.md`.

# Phase 5 — Test results

Date: 2026-11-02 · Command: `cd backend; .venv\Scripts\python -m pytest -q` · Result: **60 passed, 0 failed**.

Environment: **in-memory SQLite**, not PostgreSQL (no Postgres or running Docker daemon on this machine). JWTs are signed with a locally generated RSA key and verified by the real decode path (signature, `aud`, `exp`); no real Supabase project was contacted.

| Area | Verified (PASS) |
| --- | --- |
| Authentication | no token / garbage / expired / wrong audience / wrong signing key → 401; valid token without profile → 403; role comes from the database |
| RBAC | Faculty 403 on fees, insights, mentor tasks, audit, academic writes, student create, marks moderation; Admin 403 on attendance submit and marks submit |
| Scope / IDOR | out-of-batch student → 404 for Faculty; other faculty's assessment → 404; roster for unassigned subject → 403; fee data absent for Faculty |
| Sample student | 81.5% (163/200), 33.00/40.00, fee due 0.00, Year 2, exact name and roll |
| Students | search (name, roll), pagination, page-size cap, SQL-injection string returns nothing, duplicate roll 409, unknown fields 422 |
| Academic masters | duplicate 409, Faculty sees only assigned subjects |
| Attendance sync | first submit 201; replay ×2 → 200 and no new rows; same key different payload 409; same class/date/period new key 409; incomplete/foreign/duplicate/invalid status 422 with nothing saved; unassigned 403; future date and period 9 rejected; online save shares idempotency; admin correction needs reason and writes audit with old/new |
| Marks | max/negative/non-numeric/3-decimal/unknown-student rejected; all-or-nothing batch; full lifecycle; locked is read-only for Faculty and Admin; unlock needs reason; corrections audited; duplicate assessment 409 |
| Fees | partial payment, balance, simulated receipt, replay returns same receipt without second debit, same key different amount 409, 0/negative/3-decimals/overpay rejected, exact-balance allowed then further payment rejected, 0.10+0.20+0.30 = 0.60 exactly |
| Risk rules | 74.9 / 75 / 75.1 / 65 / 64.9, internals at exactly 40%, missing data, reproducibility, per-indicator reasons |
| AI boundary | valid output accepted; no provider, provider error/timeout, generic exception, invalid JSON, missing field, extra field, invented number → all `unavailable`; payload contains no names/roll/ids |
| Insights | Admin-only; assessment persists rules when AI unavailable; no attendance/marks/fee rows change; history appends; labelled AI text only when a provider output passed validation; tasks never auto-created; status transitions, cancel reason, past due date, invalid assignee; audit trail |
| Migration | `0001` upgrades, downgrades and re-upgrades on a clean SQLite DB; `alembic check` reports no drift from the models; Postgres DDL renders offline (`--sql`) |

## Not tested (do not treat as passing)
- Anything against **real PostgreSQL** (Numeric/UUID/JSON behaviour, concurrent inserts, real unique-violation races).
- A **database trigger** for marks `score <= max`: not implemented; enforced in the service layer only.
- Authentication against a **real Supabase project / JWKS URL**.
- A real **AI provider**.
- Concurrent updates (marks are last-write-wins).
- Performance, N+1 queries (the at-risk overview and `/overview` compute per-student stats in a loop).
- Rate limiting (not implemented).

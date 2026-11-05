# CampusOS — Phase 2: API contract (resource list)

> **Superseded for paths:** the implemented endpoints and exact paths are in `docs/phase-5/API_IMPLEMENTATION_STATUS.md` (grouped `/academic`, `/marks/assessments`, `/marks/moderation`, `/insights`, …). Behavioural rules below still apply.

Planned surface for `/api/v1`. Not implemented yet. Auth: `Authorization: Bearer <Supabase access token>` on everything except `/health`. Identity and role come from the verified token + `profiles`, never from the body. Rules: `phase-1/PRODUCT_DECISIONS.md` (PD-xx). Matrix: `AUTHORIZATION_DESIGN.md`.

Roles: **F** = Faculty (assigned subject+batch only), **A** = Office Admin.

Errors: `401` bad/expired token · `403` forbidden · `404` not found (also for out-of-scope objects, to avoid IDOR leaks) · `409` conflict · `422` validation. Body: `{ "error": { "code", "message", "details?" } }`. No stack traces.

## Platform

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/health` | public | Liveness |
| GET | `/ready` | public | Checks DB reachable; no secrets in output |
| GET | `/auth/me` | F, A | Profile, role, faculty_id |

## Academic masters

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/campus` | F, A | Single seeded campus (read-only) |
| GET/POST | `/programmes`, `/academic-years`, `/batches`, `/subjects`, `/faculty` | GET: F (assigned scope), A · POST: A | Unique constraints → 409 |
| PATCH | `/{resource}/{id}` for the above | A | |
| GET | `/assignments` | F (own), A | Drives Faculty class picker |
| POST/DELETE | `/assignments` | A | faculty–subject–batch |

## Students

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/students?q=&batch_id=&page=&page_size=` | F (assigned batches, no fees), A | Paginated, search by name/roll |
| GET | `/students/{id}` | F (scoped), A | Official attendance %, internals; `fees` block only for A |
| POST / PATCH | `/students`, `/students/{id}` | A | CSE only (P1) |

## Attendance

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/attendance/roster?batch_id=&subject_id=` | F (assigned), A | Roster for caching; includes `version` |
| GET | `/attendance/sessions?batch_id=&subject_id=&held_on=` | F, A | Existing sessions |
| POST | `/attendance/sessions` | F | Online save; same validation as sync |
| POST | `/attendance/sync` | F | Body: `idempotency_key`, batch, subject, `held_on`, `period`, complete `records[]`. Same key + same payload → 200 existing. Same key + different payload → 409. Same natural key + different key → 409. Missing roster student or bad status → 422. Not assigned → 403 (non-retryable) |
| PUT | `/attendance/sessions/{id}/correction` | A | Mandatory `reason`; audited (PD-20) |

## Marks

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/marks/components?batch_id=&subject_id=` | F (assigned), A | With lifecycle |
| GET | `/marks/components/{id}` | F, A | Grid + audit rail data |
| PUT | `/marks/components/{id}/scores` | F (draft only), A (moderated) | `0 ≤ score ≤ max`; changes audited |
| POST | `/marks/components/{id}/submit` | F | draft → submitted |
| POST | `/marks/components/{id}/moderate` | A | submitted → moderated; reason if scores changed |
| POST | `/marks/components/{id}/lock` | A | moderated → locked |
| POST | `/marks/components/{id}/unlock` | A | Reason required → moderated (PD-25) |
| GET | `/marks/components/{id}/audit` | A, F (own component) | Immutable history |

## Fees (A only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/fees/accounts?q=&page=` | Total / paid / outstanding (Decimal strings) |
| GET | `/fees/accounts/{student_id}` | Ledger + payment history |
| POST | `/fees/payments` | `idempotency_key`, `student_id`, `amount` (> 0, ≤ outstanding). Replay → existing payment + receipt. Always `kind=simulated` |
| GET | `/fees/receipts/{id}` | Watermarked Simulated |

## Insights and mentor tasks (A only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/insights?category=&page=` | Latest assessment per student, rule evidence, `rule_version` |
| POST | `/insights/students/{id}/assess` | Recompute rules; explanation `pending/available/unavailable`; AI failure never fails the call |
| GET | `/insights/students/{id}` | Evidence + explanation |
| GET/POST | `/mentor-tasks` | POST creates only from an Admin action (PD-14) |
| PATCH | `/mentor-tasks/{id}` | Status/notes |

## Overview and audit

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/overview` | F, A | Role-shaped aggregates; Faculty gets own classes only |
| GET | `/audit-events?entity_type=&page=` | A | Read-only |

## Conventions
- Money: JSON strings, `numeric(12,2)`. Marks: `numeric(6,2)`.
- Dates: `held_on` ISO date, interpreted in Asia/Kolkata (PD-07).
- Every campus-scoped query filters `campus_id`.
- Rate limit sensitive endpoints (login proxy, `/attendance/sync`, `/fees/payments`) where implemented; document actual limits when built.

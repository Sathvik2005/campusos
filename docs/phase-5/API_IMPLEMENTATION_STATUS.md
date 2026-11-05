# Phase 5 — API implementation status

Generated from the running app's OpenAPI document (47 endpoints under `/api/v1`, plus `/health` and `/ready`). **These paths supersede the paths in `docs/phase-2/API_CONTRACT.md`** (grouped as in the owner's Phase 5 prompt). Auth: `Authorization: Bearer <Supabase access token>` on everything under `/api/v1`. "A" = Office Admin, "F" = Faculty (assigned classes only).

| Group | Endpoints | Who |
| --- | --- | --- |
| auth | `GET /auth/me` | A, F |
| academic | `GET/POST /academic/programmes`, `/academic-years`, `/batches`, `/subjects`; `PATCH /batches/{id}`, `/subjects/{id}` (activate/deactivate); `GET/POST /faculty`; `GET/POST /assignments`, `DELETE /assignments/{id}` | writes A; reads A, F (F scoped; `/faculty` A only) |
| students | `GET /students` (q, batch_id, status, page, page_size ≤ 100), `GET /students/{id}`, `POST /students`, `PATCH /students/{id}` | read A, F (scoped, no fees); write A |
| attendance | `GET /attendance/roster`, `GET /attendance/sessions`, `POST /attendance/sessions` and `POST /attendance/sync` (same idempotent logic: 201 created / 200 replay / 409 conflict), `PUT /attendance/sessions/{id}/correction` | roster A, F; submit F only; correction A |
| marks | `GET/POST /marks/assessments`, `GET /marks/assessments/{id}` (+ scores), `PUT …/scores`, `POST …/submit`, `GET …/audit`, `POST /marks/moderation/{id}/moderate|lock|unlock` | create/moderate/lock/unlock A; scores F (draft) or A (moderated, reason); submit F |
| fees | `GET /fees/accounts`, `GET /fees/accounts/{student_id}`, `POST /fees/payments`, `GET /fees/receipts/{payment_id}` | A only |
| insights | `GET /insights/at-risk`, `GET /insights/students/{id}`, `POST …/assess`, `GET …/history`; `GET/POST /mentor-tasks`, `PATCH /mentor-tasks/{id}` | A only |
| audit / overview | `GET /audit` (read-only), `GET /overview` | audit A; overview A, F (role-shaped) |

Error envelope: `{"error": {"code", "message", "details?"}}` (401, 403, 404, 409, 422, 500; no stack traces).

## Gaps versus the plan
- No `GET /marks/moderation` list (moderation state is visible on assessments).
- No student "status transition" rules beyond active/inactive.
- No pagination on academic lists or mentor tasks (bounded by campus size / limit 200).
- Rate limiting is **not implemented**.
- Explanation generation depends on an AI provider that has not been chosen; the endpoint works and reports `unavailable`.

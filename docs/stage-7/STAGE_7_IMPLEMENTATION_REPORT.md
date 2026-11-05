# Stage 7 report: core modules (2026-11-05)

Verified by command: frontend Vitest 49/49, typecheck + lint clean, `next build` OK (all routes below); backend pytest 61/61 (SQLite). **Not verified:** any screen in a browser with a real login (needs Supabase credentials).

| Module | Route(s) | Roles | Status | Notes |
|---|---|---|---|---|
| Overview | `/dashboard` | both | Done | Role-shaped aggregates from `/overview`. Extra cards (trend charts, recent activity feed) NOT built |
| Academics | `/academic` | admin | Done | Years, classes (batches), subjects, faculty, assignments; 409/422 shown inline. **Deviation:** the data model has no separate semester/department entities (single programme B.Tech CSE; a class = year of study + section) |
| Students | `/students`, `/students/[id]` | both | Done | Search, class filter, pagination; detail shows attendance %, locked internals, fee due (admin only). Create/edit student UI not built (API exists) |
| Attendance | `/attendance` | faculty marks, admin corrects | Done (online) | Complete-roster rule, large Present/Absent/Late, sticky save; idempotency key reused on retry. Admin correction needs a reason; new `GET /attendance/sessions/{id}` (scoped) |
| Marks | `/marks`, `/marks/[id]` | both | Done | Inline max/negative/decimal validation; draft -> submit -> moderate -> lock -> unlock (reason); read-only when locked; history rail |
| Fees | `/fees`, `/fees/[id]` | admin | Done | Exact decimal sums, partial payments, overpay blocked, idempotent receipts, "simulated" everywhere; reconciliation totals are per page |
| Insights | `/insights` | admin | Done | Rule evidence + deterministic fallback text; mentor task only after an explicit approve step; task status updates |
| Audit | `/audit` | admin | Done | Read-only list with record-type filter and paging |

## Known limitations
- Backend and UI verified against SQLite/mocked fetch only; Playwright journeys with real sessions are blocked on Supabase credentials.
- No mobile card layouts verified at 390/360 for the new screens (tables scroll inside their container); full responsive QA is Stage 10.

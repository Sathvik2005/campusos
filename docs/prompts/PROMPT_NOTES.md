# CampusOS — Owner prompt digest (Phases 2–12)

Condensed from the owner's master prompts (not verbatim). Use alongside the per-phase plans in `docs/phase-N/`. Where a prompt and an approved Phase 1/2 decision differ, the table in §2 records which one wins.

## 1. Rules repeated in every prompt
- Read prior phase docs and inspect the real code before changing anything; never claim a feature or check passed unless it was run.
- Small, module-by-module milestones; run tests, fix, commit per milestone. Never one giant dump.
- No secrets in Git, no invented credentials, never overwrite existing `.env*`.
- No dead buttons, no fake API responses, no fake payment success, no fake AI.
- Responsive widths: 1440 / 1280 / 1024 / 768 / 390 / 360, 44px targets, no horizontal overflow. Design must be neat and consistent.
- Backend enforces permissions; frontend role checks are presentation only.
- Database: never reset, drop, truncate, rewrite applied migrations, or seed production. Owner approval before any remote migration.

## 2. Prompt vs approved-docs reconciliation (decided; revisit only on owner request)
| Topic | Prompt says | Repo decision | Reason |
| --- | --- | --- | --- |
| Attendance statuses | Present/Absent (Phase 8 example) | Present / Absent / **Late** (PD-02/03) | Approved Phase 1; the prompt marks its snippet "illustrative" |
| Risk categories | Low / Moderate / High / Insufficient | DB enum `on_track / watch / at_risk` + `confidence` (`insufficient`); UI labels may map to Low/Moderate/High | Phase 2 schema; map labels in UI |
| Thresholds | 75% shortage, 60% severe (illustrative) | 75% watch, 65% at-risk (PD-04/05) | Phase 1 approved; 60% is "to be confirmed" |
| Task statuses | OPEN→IN_PROGRESS→COMPLETED, CANCELLED | same (`open, in_progress, completed, cancelled`) | consistent |
| API paths | `/api/v1/academic/*`, `/marks/assessments`, `/marks/moderation`, `/fees/accounts`, `/fees/payments`, `/insights/at-risk`, `/audit` | Adopt these **group prefixes** when Phase 5 starts; update `phase-2/API_CONTRACT.md` first | Prompt says paths "should follow the approved Phase 2 spec"; contract needs the same grouping |
| Python | 3.12 | Python 3.11.9 (only working interpreter on this machine; 3.12/3.13 launcher entries are broken) | Documented in README |
| Frontend tree | `app/(auth)/login`, `(dashboard)/{dashboard,students,academic,attendance,marks,fees,insights}`, `features/`, `components/{ui,layout,shared,feedback}`, `lib/{api,supabase,utils}` | Adopt; Overview route = `/dashboard`, plus `/audit` | Matches prompt; screens stay per `phase-3/` |
| Phase 2 deliverable names | `API_SPECIFICATION.md`, `AI_ARCHITECTURE.md`, `FRONTEND_ARCHITECTURE.md`, `TESTING_STRATEGY.md`, `DEPLOYMENT_ARCHITECTURE.md` | Existing: `API_CONTRACT.md` + plan docs in phase-4..11 | Covered by the phase plans; add dedicated files only if the owner wants them |
| Auth | Supabase Auth, FastAPI verifies JWKS | same (ADR-03) | consistent |

## 3. Phase 6 additions (frontend)
Shell, Supabase Auth (login/logout/restore/expired), protected routes, role-aware nav, typed API client with token attach, TanStack Query, RHF+Zod, design-system components (buttons, inputs, selects, search, cards, data tables, badges, tabs, dialogs, drawers, dropdowns, toasts, pagination, skeletons, empty/error states, confirm dialogs), error boundary, not-found, responsive. Tests: Vitest + RTL + Playwright. Docs: `docs/phase-6/{FRONTEND_ARCHITECTURE_IMPLEMENTATION,API_INTEGRATION_STATUS,RESPONSIVE_QA,FRONTEND_TEST_RESULTS}.md`. Missing endpoint → document the gap, never fake it.

## 4. Phase 7 additions (modules, in order)
Dashboard → Academic masters → Students → Attendance → Marks → Fees → AI insights → Audit. Per module: design review, contract review, frontend, backend integration, success + failure tests, role tests, mobile check, fix, commit; do not start the next until the current passes. Docs: `docs/phase-7/{MODULE_IMPLEMENTATION_STATUS,END_TO_END_TEST_RESULTS,RESPONSIVE_TEST_RESULTS,KNOWN_LIMITATIONS}.md`. Exclude management/pharmacy sample students.

## 5. Phase 8 additions (offline)
Dexie tables: rosters, sessions, records (clientRecordId, serverId, revision, syncStatus, retryCount, lastError), sync queue (idempotency key, retries, nextRetryAt, status). States: online, offline, pending, syncing, synced, failed, conflict. Conflict types: record exists, modified by authorised user, session closed, assignment revoked, outdated session, multiple local revisions; never silently overwrite or discard; audit resolutions. Verify backend reachability with a real request, not `navigator.onLine`. Never store tokens; keep pending after logout; never sync as another user. Docs: `docs/phase-8/{OFFLINE_ATTENDANCE_ARCHITECTURE,LOCAL_DATABASE_SCHEMA,SYNC_PROTOCOL,CONFLICT_RESOLUTION,OFFLINE_TEST_RESULTS}.md`.

## 6. Phase 9 additions (AI)
Deterministic engine independent of the provider; stored per assessment: category, indicators, evidence, rule version, timestamp, freshness, status. Explanation input has no names/identifiers; Pydantic-validated output; no fabricated fallback text pretending to be AI. Separate service boundary with no DB write access. Mentor task: explicit admin action, assignee, due date, notes, status changes audited. NL query is an optional stretch only. Docs: `docs/phase-9/{RISK_RULES,AI_EXPLANATION_ARCHITECTURE,AI_SAFEGUARDS,MENTOR_WORKFLOW,AI_TEST_RESULTS}.md`.

## 7. Phases 10–12
Covered by `docs/phase-10/TESTING_SECURITY_PLAN.md`, `phase-11/DEPLOYMENT_PLAN.md`, `phase-12/SUBMISSION_PLAN.md`. Report file lists in those plans match the owner prompts, plus the Phase 11 owner checklist (Supabase URL/keys/DB string, Auth config, Render + Vercel authorisation, optional AI key, env vars, migration approval).

## 8. Owner request: notifications
Owner asked to be pinged when Phase 6 is done and again when everything is done; design must be neat. Use the terminal push notification at those two points only.

# CampusOS — Phase 10: Testing, QA and security plan

**Objective:** prove claims with evidence. This is the quality gate before deployment. It adapts the owner's Phase 10 master prompt to the approved stack (FastAPI + Next.js + Supabase Postgres).

## 1. Status vocabulary
PASS (verified with evidence) · FAIL (reproducible defect) · NOT TESTED · BLOCKED (missing config). Unimplemented features are never PASS.

## 2. Coverage
| Area | Method |
| --- | --- |
| Backend / API | Pytest + HTTPX: status codes, validation, auth, RBAC matrix, pagination, duplicates, rollback |
| Database | constraints, uniqueness, Decimal precision, audit integrity, migrations apply to a clean DB; schema compared with live DB in Phase 11 (read-only) |
| Authentication | login, invalid, logout, restore, expired token, protected routes, unauthenticated API → 401 |
| Authorisation | Faculty 403 matrix, IDOR checks (other batch/faculty/student ids → 404), mass assignment |
| Offline | Phase 8 scenarios against real IndexedDB and server rows |
| Marks / Fees | max/negative, lifecycle, lock, audit; balances, partial pay, replay, rollback |
| AI | boundaries, missing key, timeout, malformed JSON, no write path, PII-free payload |
| Frontend | Vitest components/queue; Playwright journeys for both roles |
| Responsive | 1440, 1280, 1024, 768, 390, 360 on every module; no overflow, 44px targets |
| Accessibility | axe + keyboard + focus + contrast + reduced motion; WCAG 2.2 AA "where practical" |
| Performance | Lighthouse, bundle size, API latency on seeded data, query plans, N+1 and missing indexes; no load tests against production |
| Security | secret scan (tree + git history), dependency audit (pip-audit / npm audit), bandit, CORS allowlist, no service-role key in bundles, debug off, error messages, XSS/SQLi review |

## 3. Database safety
Destructive tests run only on an isolated test database. Never touch production data, never rewrite applied migrations, never assume live schema equals the migration files.

## 4. Defect handling
Maintain `BUG_REGISTER.md` (id, module, steps, expected, actual, severity, evidence, root cause, fix, regression test, status). All critical and high defects are fixed before release; no test is disabled to go green; no requirement is quietly changed.

## 5. Deliverables (`docs/phase-10/`, each with date, commit, environment, tools, results, limitations)
`QA_MASTER_REPORT.md`, `TEST_COVERAGE.md`, `BUG_REGISTER.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `ACCESSIBILITY_REPORT.md`, `RESPONSIVE_QA_REPORT.md`, `DATABASE_INTEGRITY_REPORT.md`, `RELEASE_READINESS.md`.

## 6. Release decision
READY · READY WITH LIMITATIONS · NOT READY. A passing test command alone never justifies READY. No claim of a formal penetration test unless one was performed.

## 7. Exit
Reports produced from real runs, defects fixed and retested, changes committed, outstanding issues listed, owner approval requested before Phase 11.

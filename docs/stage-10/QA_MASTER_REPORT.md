# QA master report (2026-11-05)

Scope: everything built in stages 4-9. Every result below comes from a command run in this session.

| Layer | Command | Result |
|---|---|---|
| Backend unit/API | `pytest -q` | **151 passed** (SQLite) |
| Route security matrix | `tests/test_security_matrix.py` | included above: every API route rejects anonymous (401); admin-only routes reject faculty (403); faculty-only routes reject admin (403) |
| Frontend unit/component | `npm test` | **89 passed** (jsdom + fake-indexeddb) |
| Typecheck / lint | `npm run typecheck`, `npm run lint` | clean |
| Production build | `npm run build` | passes, all routes generated |
| Browser e2e | `npm run test:e2e -- --workers=1` | **12 passed** (login page at 1440/1280/1024/768/390/360, redirects, CORS to real FastAPI, security headers) |
| Dependencies | `npm audit --omit=dev`, `pip-audit -r requirements.txt` | 0 known vulnerabilities each |
| Migration drift | `alembic upgrade head` + `alembic check` on SQLite | "No new upgrade operations detected" |

## Workflow coverage by module
Covered by automated tests: students (backend CRUD/scope, UI list/search), academics (forms, 409 inline), attendance (online, offline, retry, conflict, correction), marks (validation, lifecycle, lock), fees (decimal, partial, overpay, idempotent replay), risk rules + guarded AI, audit.

## NOT tested (blocking a full sign-off)
1. **Any authenticated browser session.** No Supabase project/credentials: login, role-specific screens, mobile bottom nav, real offline reload/close-reopen are unverified in a real browser.
2. **PostgreSQL / Supabase.** All backend tests run on SQLite. JWKS verification against real Supabase tokens untested (tests sign their own tokens).
3. Real AI provider call (no key).
4. Console-error sweep, Lighthouse, screen-reader pass, responsive checks of the 8 authenticated screens.

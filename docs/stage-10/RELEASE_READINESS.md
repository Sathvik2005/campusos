# Release readiness (2026-11-05)

**Decision: not ready for a production claim; ready for a clearly-labelled demo build once the blockers below are cleared.**

## Passing
Automated suites (151 backend, 89 frontend, 12 e2e), typecheck, lint, build, dependency audits, route-level authorization matrix, no migration drift.

## Blockers (owner input needed)
1. Supabase project + keys -> local `.env`/`.env.local`; then run authenticated Playwright journeys (admin and faculty, 1440 and 390) and the real offline reload test.
2. Run backend and migration on real PostgreSQL; verify JWKS with a real token.
3. Responsive/a11y/Lighthouse pass over authenticated screens.

## Should-fix before wider release
Rate limiting (O-01), CSP (O-02), mentor-task assignee/completion notes (O-03).

## Not claimed anywhere
Production deployment, live AI output, real-browser offline proof, Lighthouse scores.

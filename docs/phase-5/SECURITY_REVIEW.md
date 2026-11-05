# Phase 5 — Security review (self-review, not a penetration test)

Date: 2026-11-02. Scope: backend code as of this phase. No formal security certification is claimed.

| Control | State | Evidence |
| --- | --- | --- |
| JWT verification (signature, `aud`, `exp`, required `sub`) | Implemented | `core/security.py`; tests with forged/expired/wrong-aud tokens |
| Identity/role from token + `profiles`, never from the body | Implemented | schemas forbid unknown fields; tests |
| Server-side RBAC on every `/api/v1` route | Implemented | dependencies `require_admin`/`require_faculty`/`get_current_user`; 403 matrix tests |
| Campus + assignment scoping, no IDOR signal | Implemented | 404 for out-of-scope ids; tests |
| Mass assignment | Mitigated | `extra="forbid"` on all request models |
| SQL injection | Mitigated | ORM/bound parameters only; injection-string test |
| Audit trail | Implemented | same-transaction audit rows; no write/delete route for audit |
| Money handling | Implemented | `Decimal`, `numeric(12,2)`, simulated only, idempotent |
| CORS | Explicit origin list, wildcard rejected at startup, no credentials | `core/config.py`, tests |
| Error messages | Generic 500 body; details only in server logs | `core/errors.py` |
| `/docs` and `/openapi.json` | Disabled when `APP_ENV=production` | `main.py` |
| Secrets | None in repo; `.env*` ignored; AI key optional and never logged | `.gitignore`, `config.py` |
| AI privacy | No names/identifiers sent; output validated; numbers not in evidence rejected; no DB access in the module | tests |
| Seed safety | Refuses production, non-empty DB, and missing flag | `seed.py` |

## Open items (carried to Phase 10)
1. **No rate limiting** on login-adjacent or write endpoints.
2. JWKS keys are cached by PyJWT; behaviour on key rotation and Supabase outage is untested.
3. Supabase tokens may use ES256 or RS256; both are accepted, other algorithms are rejected. Untested against a real project.
4. Logging: request logging with ids exists only for errors; no access log policy yet; verify no PII in logs in Phase 10.
5. Marks and fees have no optimistic-locking/concurrency control.
6. Dependency vulnerability scan (`pip-audit`) and static analysis (`bandit`) not yet run.
7. DB-level least-privilege role and RLS are not configured (ADR-05: optional defense-in-depth).

# Security audit (2026-11-05)

| Area | Result | Evidence |
|---|---|---|
| Authentication on every API route | PASS | `test_every_api_route_rejects_anonymous_callers` runs against the route table (all /api/v1 routes) |
| Role enforcement | PASS | admin-only routes 403 for faculty; faculty-only routes 403 for admin (parametrised over the route table) |
| IDOR | PASS (tested for sessions, students, assessments) | out-of-scope ids return 404 not 403 (no existence signal); `test_session_detail_is_scoped`, students/marks scope tests |
| SQL injection | PASS | SQLAlchemy parameter binding; search with `x' OR '1'='1` and `%` tested as inert |
| Mass assignment | PASS | request schemas are explicit Pydantic models (`In` base); campus/actor ids come from the token, not the body |
| JWT verification | PARTIAL | verified against test keys; real Supabase JWKS/issuer/audience NOT tested |
| CORS | PASS | allow-list from config, no credentials, only needed methods/headers; disallowed origin gets no ACAO header (tested) |
| Secrets | PASS | `.env*` ignored; scan of tracked files found no keys/tokens; `.env.example` has blanks; service-role key never used in frontend |
| Sensitive data exposure | PASS | `/health` and `/ready` expose no secrets (tested); AI payload contains no names/ids; offline cache holds rosters/class lists only, no tokens or fee data |
| Dependencies | PASS | npm audit (prod) 0; pip-audit 0 |
| Security headers | PARTIAL | nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy set; no CSP, no HSTS (Vercel adds HSTS on its domains) |
| Rate limiting | FAIL (open O-01) | none on the API |
| RLS | NOT TESTED | FastAPI is the only writer; RLS is optional defence in depth and no Postgres was available |
| Audit log integrity | PASS | no write/update/delete route exists for audit events (route matrix + code) |
| Production docs endpoints | PASS | `/docs` and `/openapi.json` disabled when `is_production` |

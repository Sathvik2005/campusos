# CampusOS — Phase 2: Authentication and authorisation

## Authn

1. Browser: Supabase Auth email/password.  
2. Frontend stores session via Supabase client (not in Dexie).  
3. API calls: `Authorization: Bearer <access_token>`.  
4. FastAPI: fetch JWKS from `SUPABASE_JWKS_URL`, verify signature, `iss`, `aud`, `exp`.  
5. `sub` → `profiles.id`. Missing profile → 403.  
6. Never trust `role` or `user_id` in JSON bodies.

Logout: Supabase signOut; subsequent API 401.

Errors: 401 invalid/expired; 403 authenticated but forbidden.

## AuthZ matrix

| Resource | Faculty | Office Admin |
| --- | --- | --- |
| `/auth/me` | self | self |
| Masters write | 403 | CRUD CSE campus |
| Masters read | assigned only | campus |
| Students list/detail | assigned batch, **no fees** | full CSE |
| Students write | 403 | CSE only |
| Attendance create/sync | assigned subject+batch; unsynced/new only | — |
| Attendance correct | 403 | yes + reason |
| Marks draft/submit | assigned + lifecycle draft | read |
| Marks moderate/lock/unlock | 403 | yes |
| Fees | 403 | yes |
| Insights + tasks | 403 | yes |
| Audit | 403 | read |

Campus boundary: MVP has one campus; still filter `campus_id` on every query.

## DB

Application DB user: migrate + DML. No browser service role. RLS optional later (ADR-05).

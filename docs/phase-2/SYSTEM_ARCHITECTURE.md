# CampusOS — Phase 2: System architecture

Modular monolith. One campus, B.Tech CSE, Faculty + Office Admin.

```
Browser (Next.js + Dexie)
    │  HTTPS JSON + Bearer (Supabase access token)
    ▼
FastAPI on Render  ──JWKS──▶ Supabase Auth
    │  SQLAlchemy
    ▼
PostgreSQL on Supabase
```

## Responsibilities

| Component | Does | Does not |
| --- | --- | --- |
| Next.js | UI, RHF+Zod, TanStack Query, Dexie, attach JWT | Authorise writes, compute official %, talk to Postgres |
| FastAPI | Authn/Z, validation, transactions, audit, risk rules, AI explain | Trust `user_id` in body |
| Postgres | Durable records, unique/check constraints | Be called from the browser |
| Dexie | Roster cache + attendance outbox | Store tokens or fee data |
| AI provider | Explanation JSON | Write rows |

## Data movement

1. Login: Supabase Auth in browser → session.  
2. API: `Authorization: Bearer <access_token>`.  
3. FastAPI: verify JWT (iss, aud, exp, signature) → load `profiles.role` + `faculty_id`.  
4. Service + repository + transaction.  
5. Attendance offline: Dexie first → sync POST → unique constraints.

## Frontend layers

`app/` routes · `components/` shell/ui · `features/` modules · `lib/api` client · `lib/offline` Dexie

## Backend layers

`api/v1` · `schemas` · `services` · `repositories` · `models` · `core` (config, security, db)

## Diagrams

See `docs/phase-2/diagrams/*.mmd`.

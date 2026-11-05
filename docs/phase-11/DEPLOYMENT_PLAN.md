# CampusOS — Phase 11: Production deployment plan

**Objective:** live system on Vercel (`frontend/`), Render (`backend/`) and Supabase (Postgres + Auth). Requires Phase 10 release-readiness not NOT READY. The owner supplies all credentials and approves every production change.

## 1. Environments
Local, preview/staging and production stay separate, frontend and backend configured independently (`frontend/.env.local`, `backend/.env`; committed `.env.example` templates only). Never overwrite existing env files, never print secret values, never put a service-role key in the browser. Inventory every variable (name, app, environment, required, purpose, public/secret) from the real code.

## 2. Database safety gate (before touching Supabase)
1. Identify the exact Supabase project and environment.
2. Inspect, read-only: tables, columns, FKs, unique/check constraints, indexes, RLS policies, Alembic version table.
3. Compare with the local Alembic history; document drift and stop for review. Do not silently repair.
4. Confirm a recoverable backup exists.
5. Review the exact migration SQL; flag destructive operations; prefer additive migrations.
6. Present the plan; **apply only after explicit owner approval**.

Prohibited without explicit approval: drop/truncate, `supabase db reset` on a remote, deleting user or student data, rewriting applied migrations, running dev seed against production, disabling RLS, changing production permissions. Migrations run through a controlled procedure, never on every app restart.

## 3. Sequence
1. Confirm Phase 10 readiness; clean Git tree; commit and push approved changes.
2. Schema inspection → migration review → **owner approval** → apply.
3. Render: Python version, install and start command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`), health/readiness checks, debug off, CORS allowlist (local, approved preview, production domain), secrets in Render config.
4. Verify backend `/health` and `/ready`.
5. Vercel: correct root (`frontend`), build/install commands, env vars, HTTPS API URL, no localhost left in the build. Check whether a Vercel project already exists before creating one; link only after confirming team and project; run `vercel env pull` only with owner approval and never overwrite an existing env file.
6. Supabase Auth redirect URLs and JWT settings (issuer, audience, JWKS) match the deployed domains.
7. Production demo accounts (synthetic Faculty and Admin) created only with owner approval.
8. Smoke tests on demo records only: login/logout, protected pages, dashboard, students, masters, attendance, offline attendance and sync, marks lifecycle, fees/mock payment/receipt, insights with and without AI, mentor tasks, audit, mobile layouts, console and network errors, backend logs. Record what was verified locally vs live.

## 4. Documentation (`docs/phase-11/`)
`DEPLOYMENT_ARCHITECTURE.md`, `LOCAL_ENVIRONMENT_SETUP.md`, `ENVIRONMENT_VARIABLE_INVENTORY.md`, `SUPABASE_DATABASE_REVIEW.md`, `DATABASE_MIGRATION_PLAN.md`, `RENDER_DEPLOYMENT.md`, `VERCEL_DEPLOYMENT.md`, `PRODUCTION_SMOKE_TESTS.md`, `ROLLBACK_AND_RECOVERY.md`, `DEPLOYMENT_STATUS.md`. Do not claim monitoring or backups exist unless verified.

## 5. Owner checklist
Supabase project URL/keys and DB connection, Auth configuration, Render and Vercel authorisation, AI provider key (optional), preview and production env vars, approval of the reviewed migrations.

## 6. Stop conditions and handoff
Stop at any credential, authorisation or production-migration gate. Report: what is ready, what is actually deployed, what needs owner action, exact env files and variable names, schema/migration status, real URLs, remaining blockers. Never claim success because a command ran.

## 7. Completion
Frontend and backend deployed, DB connection verified, auth works on the live domain, CORS correct, core smoke tests pass, mobile checked live, migrations verified, no secrets exposed, documentation accurate.

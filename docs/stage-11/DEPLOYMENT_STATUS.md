# Deployment status (2026-11-05)

**Nothing is deployed.** No frontend URL, no backend URL, no migration applied. Every item below was checked, not assumed.

| Question | Answer (evidence) |
|---|---|
| Local environment ready? | Code builds and tests pass locally. Runtime config is NOT: no Supabase values exist |
| `frontend/.env.local` exists? | **No** (only `frontend/.env.example`) |
| `backend/.env` exists? | **No** (only `backend/.env.example`) |
| Missing credentials | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWKS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional `AI_PROVIDER_API_KEY` |
| Vercel | CLI 52.0.0 installed and signed in (account `kanithisathvik`); **no CampusOS project exists** (4 unrelated projects listed). Nothing created or linked |
| Render | CLI not installed; service not created. `render.yaml` blueprint is committed ready for use |
| Supabase | CLI not installed; no project connected; remote schema NOT inspected |
| Schema compatible? | Unknown. Local models and migration `0001` have no drift (SQLite `alembic check`); not compared with any remote |
| Migrations applied? | No |
| Deployment succeeded? | No deployment attempted (gates below not passed) |
| Live URLs | None |

## Why I stopped
1. The database gate (inspect remote, review SQL, backup, owner approval) cannot start without a Supabase project.
2. Auth redirect URLs and CORS need the real domains, which exist only after the Vercel and Render projects are created.
3. Creating a Vercel project and publishing a build that cannot reach an API would be a broken public deployment.

## What the owner does (in order)
1. Create a Supabase **dev** project; copy Project URL, anon key, JWKS URL, and the pooled Postgres connection string.
2. Put backend values in `backend/.env` and frontend values in `frontend/.env.local` (templates: `.env.example`). Do not paste secrets into chat.
3. Tell me to run: local migration + seed against the dev project, authenticated Playwright journeys.
4. Approve the migration plan (`DATABASE_MIGRATION_PLAN.md`) for the production project.
5. Create the Render service from `render.yaml` (Blueprint) and add secrets in the Render dashboard.
6. Approve creating the Vercel project (root dir `frontend`) and set `NEXT_PUBLIC_*` variables.
7. Add the final domains to Supabase Auth redirect URLs and to `CORS_ORIGINS`.

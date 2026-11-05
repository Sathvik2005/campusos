# CampusOS: deployment guide

Repository: https://github.com/Sathvik2005/campusos

Written so that someone who has never seen the project can set it up without help. Companion documents: [`docs/RUNBOOK.md`](docs/RUNBOOK.md) (operating it) and [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) (step-by-step scenarios).

> **Status honesty.** The code, tests and build were verified locally (backend 151 tests, frontend 89, browser e2e 12). The steps that need a real Supabase project, Render and Vercel (parts C to H) are written from the code and the platforms' documented behaviour but **have not yet been executed end to end** because no credentials were available when this was written. If a dashboard label differs, follow the intent. No live URL exists yet.

## 0. What you are deploying

| Piece | Tech | Where |
|---|---|---|
| Web app | Next.js 16 (`frontend/`) | Vercel |
| API | FastAPI (`backend/`) | Render |
| Database + sign-in | PostgreSQL + Auth | Supabase |

The browser calls only the API. The API is the only thing that writes to the database. No service-role key is ever used in the browser.

## 1. Prerequisites

- Git, Node.js 24+, Python 3.11+ (3.12 is the documented target; 3.11.9 is what the tests ran on).
- Accounts (free tiers are enough): GitHub, Supabase, Render, Vercel.
- About 2 GB free RAM for tests and builds.

## 2. Get the code

```bash
git clone https://github.com/Sathvik2005/campusos.git
cd campusos
```

## A. Run it locally with no accounts (smoke check, 5 minutes)

```bash
# backend
cd backend
python -m venv .venv
# Windows: .venv\Scripts\python   macOS/Linux: .venv/bin/python
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m pytest -q               # expect: 151 passed
.venv\Scripts\python -m uvicorn app.main:app --port 8000   # leave running

# frontend (second terminal)
cd frontend
npm install
npm test                                         # expect: all pass
npm run dev                                      # http://localhost:3000
```
Expected without any configuration: the login page loads and says sign-in is not configured; `http://localhost:8000/health` returns `{"status":"ok"}`; `http://localhost:8000/ready` shows `"database":"not_configured"`. That is correct and honest, not an error.

## B. Create the Supabase project

1. supabase.com, New project. Choose a region near your users; save the database password somewhere safe.
2. **Project Settings, API:** note the Project URL and the `anon` public key. (The `service_role` key is never used by this app; do not copy it anywhere.)
3. **Sign-in tokens:** the API verifies tokens with the project's public signing keys (JWKS). In Project Settings, JWT Keys (or Authentication, Signing keys) make sure asymmetric signing keys (ES256/RS256) are enabled. The JWKS URL is `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`. Open it in a browser: it must show a JSON `keys` list. If your project only offers the legacy HS256 secret, enable the new signing keys first; the API only accepts RS256/ES256.
4. **Database connection string:** Project Settings, Database, Connection string, copy the **pooled (Transaction/Session)** URI. It looks like `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`. The app rewrites it to the psycopg driver automatically.
5. **Create demo sign-in users** (Authentication, Users, Add user, "Auto confirm"): one admin and up to three faculty, with synthetic emails such as `admin@demo.campusos.example`. Copy each user's **UUID** from the Users list.

## C. Configure the backend (local, against your DEV Supabase project)

```bash
cd backend
copy .env.example .env        # macOS/Linux: cp .env.example .env
```
Edit `backend/.env` (never commit it; it is git-ignored):

```
APP_ENV=development
LOG_LEVEL=INFO
DATABASE_URL=<pooled connection string from B4>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
CORS_ORIGINS=http://localhost:3000
AI_PROVIDER_API_KEY=          # optional; leave empty for rule-based text only
```

## D. Create the tables and demo data (DEV database only)

```bash
cd backend
.venv\Scripts\python -m alembic upgrade head          # creates 21 tables (revision 0001)
.venv\Scripts\python -m alembic current                # must print: 0001 (head)

# demo data + link the Supabase users you created (IDs from B5):
.venv\Scripts\python -m app.seed --i-understand-this-writes-demo-data ^
   --admin-user-id <ADMIN-UUID> --faculty-user-id <FACULTY1-UUID> --faculty-user-id <FACULTY2-UUID>
```
(Use `\` instead of `^` on macOS/Linux.) The seed refuses to run if `APP_ENV=production` or if students already exist. It creates a synthetic B.Tech CSE class including **Subhashree Mohanty, ENG-24-CSE-0412, Year 2, attendance 81.5%, internals 33/40, fee due 0**. `--faculty-user-id` values map, in order, to Demo Faculty 1, 2, 3. A sign-in user without a profile row gets "No CampusOS profile for this account" by design.

> **Never run the seed or `alembic downgrade` against a production database.** Migrations on production: see `docs/stage-11/DATABASE_MIGRATION_PLAN.md` (backup first, review the SQL, apply manually).

## E. Configure and run the frontend locally

```bash
cd frontend
copy .env.example .env.local
```
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from B2>
```
Run the API (`uvicorn app.main:app --port 8000` in `backend`) and the web app (`npm run dev` in `frontend`). Open http://localhost:3000, sign in as the admin user. Check:
- `http://localhost:8000/ready` now shows `"database":"ok"`.
- Overview shows student and dues numbers; Students lists the sample student.

## F. Deploy the API on Render

1. Push the repository to GitHub (already done if you cloned the official repo; fork it first to deploy your own copy).
2. Render dashboard, New, **Blueprint**, pick the repository. Render reads `render.yaml` and proposes the service `campusos-api` (root `backend`, health check `/health`, `APP_ENV=production`).
3. Fill the secret values it asks for: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWKS_URL`, optional `AI_PROVIDER_API_KEY`, and `CORS_ORIGINS` (set it after step G to the exact Vercel URL; for now `http://localhost:3000`).
4. Deploy. When it is live open `https://<service>.onrender.com/health` (expect ok) and `/ready` (expect `database: ok`).
5. Run the migration against the production database **yourself**, once, from your machine with the production `DATABASE_URL` in the shell (Render does not run migrations): `alembic upgrade head`. Back up first (Supabase dashboard, Database, Backups). Do not seed production.
Free-plan services sleep when idle; the first request after a pause takes about a minute.

## G. Deploy the web app on Vercel

1. Vercel, Add New, Project, import the repository. **Root Directory: `frontend`.** Framework: Next.js (auto).
2. Environment variables (Production and Preview): `NEXT_PUBLIC_API_BASE_URL` = the Render URL (https), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. These values are baked in at build time: if you change one, redeploy.
4. Check the build output contains no `localhost` API address.

## H. Connect the three services

- Render `CORS_ORIGINS` = the exact Vercel origin, for example `https://campusos-xxxx.vercel.app` (no trailing slash, no wildcard; list preview origins comma-separated if needed). Save; Render redeploys.
- Supabase, Authentication, URL Configuration: set Site URL to the Vercel URL and add it to Redirect URLs.
- Production demo users: create them in Supabase Auth and link them with a **one-off SQL insert into `profiles`** (id = the user's UUID, `campus_id`, `role`, `faculty_id` for faculty, `display_name`) after the first real campus row exists. The seed script is for development databases only.

## I. Demo workflow (10 minutes)

Follow `docs/PLAYBOOK.md`, scenario "Demo for a reviewer". Short version:
1. **Admin:** Students, search "Subhashree": 81.5% attendance, 33/40, fee due 0.
2. **Admin:** Academics shows the year, class, subjects, faculty and assignments; try adding a duplicate and read the inline message.
3. **Faculty (second browser/profile):** Attendance, pick a class, "Mark remaining present", change two students, Save. The header chip shows **All synced**.
4. **Offline proof:** with the roster loaded, turn the network off (browser dev tools, Network, Offline), mark another period, Save. The chip says **Offline · saved** / **waiting to sync**; reload the page; the record is still listed under "Saved on this device". Turn the network on: it syncs and the chip turns to **All synced**; the server holds exactly one session.
5. **Marks:** admin creates an assessment; faculty enters scores (try 41/40 to see the inline error), submits; admin moderates and locks; try to edit (read-only); unlock needs a reason.
6. **Fees:** admin records a partial simulated payment, sees the receipt; overpay is blocked.
7. **Insights:** select a flagged student, read the evidence, "Create mentor task", review, Approve.
8. **Audit:** the actions above appear, read-only.

**Demo credentials:** none are provisioned in this repository or on any deployment. You create the sign-in users in your own Supabase project (part B5).

## J. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Login page says "isn't configured" | `NEXT_PUBLIC_SUPABASE_*` missing | set `frontend/.env.local`, restart `npm run dev` |
| "Server unreachable" chip / network errors | API not running or wrong `NEXT_PUBLIC_API_BASE_URL` | start the API; check the URL; redeploy Vercel after changing it |
| Browser console: CORS error | origin not in `CORS_ORIGINS` | add the exact origin (scheme+host, no slash), restart/redeploy API |
| Signed in but "No CampusOS profile for this account" | no row in `profiles` for that auth user | link the user (seed `--admin-user-id/--faculty-user-id`, or SQL insert) |
| API 401 for everyone | wrong `SUPABASE_JWKS_URL` or project uses HS256 only | open the JWKS URL; enable asymmetric signing keys |
| `/ready` says `database: unavailable` | bad `DATABASE_URL`, paused project, or firewall | test the string with `psql`; use the pooled URI |
| `alembic upgrade head` errors on an existing database | tables already exist from another source | STOP; do not force. Follow `docs/stage-11/SUPABASE_DATABASE_REVIEW.md` |
| Tests crash with `VirtualAlloc`/out of memory (Windows) | low virtual memory | free disk on C:, set `NODE_OPTIONS=--max-old-space-size=512`; Vitest is already single-file-at-a-time; run Playwright with `--workers=1` |
| Attendance says offline and "roster isn't saved" | class never opened while online | open the class once online, then offline works |
| Chip shows "N need review" | server already has a different record for that class/period (409) | an Office Admin reviews; the marks stay on the device |

## K. Known limitations (read before relying on it)

No signed-in browser run and no real-PostgreSQL run were possible while this was written; no live AI call was made (no key); no Service Worker, so pending attendance syncs the next time the app is opened online; no rate limiting or CSP; the academic model has no separate semester or department tables. Full list: `docs/stage-10/BUG_REGISTER.md` and `docs/stage-10/RELEASE_READINESS.md`.

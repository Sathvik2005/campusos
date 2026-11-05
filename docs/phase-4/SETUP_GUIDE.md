# Phase 4 — Setup guide

Commands below were run on Windows 11 (PowerShell/Git Bash) with Node 26.2.0, npm 11.13.0, Python 3.11.9 on 2026-11-02.

## 1. Clone
```powershell
git clone <repository-url> campusos
cd campusos
```
(The repository has no remote yet; create and push one only after the owner approves.)

## 2. Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload     # http://localhost:8000
```
- `GET /health` → `{"status":"ok"}`.
- `GET /ready` → `{"status":"degraded","database":"not_configured"}` until `DATABASE_URL` is set; `503` with `database: "unavailable"` if it is set but unreachable.
- `/docs` (Swagger) is disabled when `APP_ENV=production`.
- Alembic: `alembic current` refuses to run unless `DATABASE_URL` is set. Migrations are never applied automatically.

## 3. Frontend
```powershell
cd frontend
npm install
copy .env.example .env.local      # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev                       # http://localhost:3000
```

## 4. Database (Supabase)
1. Create a **development** Supabase project (never the production one).
2. Copy the Postgres connection string (Project Settings → Database) into `backend/.env` as `DATABASE_URL`.
3. Confirm `GET /ready` shows `"database":"ok"`.
4. No schema exists yet; Phase 5 adds the first Alembic migration. Do not run migrations against a database holding real data without review.

## 5. Verification run (2026-11-02)
| Check | Result |
| --- | --- |
| Backend `pytest` | 5 passed |
| Frontend `npm test` (Vitest) | 5 passed |
| `npm run typecheck`, `npm run lint` | no errors |
| `npm run build` | succeeded |
| Playwright (Edge): page loads, shows "Server online" from a real CORS request, no JS errors; no horizontal overflow at 1440/1024/768/390/360 | 6 passed |
| `/ready` against a real database | **Not tested** (no database configured yet) |
| Supabase Auth | **Not tested** (Phase 6) |

## 6. Troubleshooting
| Symptom | Fix |
| --- | --- |
| Page says "Server unreachable" | Backend not running, wrong `NEXT_PUBLIC_API_BASE_URL`, or origin missing from `CORS_ORIGINS` |
| "Missing configuration: NEXT_PUBLIC_API_BASE_URL" | Create `frontend/.env.local` and restart `npm run dev` |
| Backend refuses to start: CORS wildcard | List explicit origins in `CORS_ORIGINS` |
| `alembic` says DATABASE_URL is not set | Intentional; set it in `backend/.env` |
| `py -3.12` fails | This machine's 3.12/3.13 launcher entries are broken; use `python` (3.11) |
| `npm i` ERESOLVE on vitest | `@types/node` must be ^24 (already set) |
| `playwright install` download fails | Config uses system Edge (`channel: "msedge"`), no download needed |

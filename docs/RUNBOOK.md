# CampusOS runbook (operating the system)

Audience: whoever keeps CampusOS running. No prior knowledge assumed. Setup from scratch is in [`deployment.md`](../deployment.md); scenario checklists are in [`PLAYBOOK.md`](PLAYBOOK.md).

## 1. What runs where

| Component | Host | Check it is alive | Logs |
|---|---|---|---|
| Web app | Vercel | open the site; sign-in page loads | Vercel project, Deployments, a deployment, Logs |
| API | Render service `campusos-api` | `GET <api>/health` returns `{"status":"ok"}`; `GET <api>/ready` shows `"database":"ok"` | Render service, Logs |
| Database + sign-in | Supabase | Dashboard shows the project Healthy; `/ready` is ok | Supabase, Logs |

There is no automated monitoring or alerting configured. Someone must look at `/ready` (a free uptime monitor pointed at `<api>/ready` is the cheapest fix). Backups are whatever the Supabase plan provides: confirm it in Database, Backups before relying on it.

## 2. Configuration reference (names only; never paste values into tickets or chat)

Backend (Render, Environment): `APP_ENV`, `LOG_LEVEL`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_AUDIENCE`, `CORS_ORIGINS`, `AI_PROVIDER_API_KEY` (optional).
Frontend (Vercel, Environment Variables): `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Changing any of these requires a **redeploy** of the frontend.
Never exists in this system: a Supabase service-role key in the app, secrets in Git.

## 3. Start, stop, redeploy

| Task | How |
|---|---|
| Redeploy API | Render, service, Manual Deploy, Deploy latest commit |
| Restart API | Render, service, Manual Deploy, Clear build cache & deploy (or Restart) |
| Redeploy web | Vercel, Deployments, the latest, Redeploy |
| Roll back web | Vercel, Deployments, pick the previous good one, Promote to Production |
| Roll back API | Render, service, Events/Deploys, pick previous, Rollback |
| Run locally | `deployment.md` part A |

## 4. Routine tasks

**Add a faculty member (sign-in + role):**
1. In the app (Admin, Academics, Faculty) add the person (name, employee code, email); note nothing is created in Supabase by this.
2. Supabase, Authentication, Users, Add user (auto confirm); copy the UUID.
3. Link it: run in the Supabase SQL editor (replace the placeholders; `faculty_id` is the id of the faculty row from step 1, `campus_id` the single campus row):
   `insert into profiles (id, campus_id, role, faculty_id, display_name, created_at, updated_at) values ('<auth-uuid>', '<campus-id>', 'faculty', '<faculty-id>', '<Name>', now(), now());`
   (If the insert complains about a missing column, run `select * from profiles limit 1;` and match the columns.)
4. Assign teaching classes (Admin, Academics, Teaching assignments).

**Disable someone:** in Supabase delete or ban the auth user (they can no longer get a token). Their profile row can stay; data and audit history are kept.

**Reset a password:** Supabase, Authentication, Users, the user, Send password recovery (or set a new one).

**Rotate a secret:** create the new value at the provider, update it in Render/Vercel, redeploy, then revoke the old one. Order matters: new first, revoke last.

**Apply a database migration (production):** never automatic. Follow `docs/stage-11/DATABASE_MIGRATION_PLAN.md`: back up, `alembic upgrade head --sql` to review, get approval, `alembic upgrade head` from a trusted machine, verify `alembic current` and `/ready`.

**Backup/restore:** use Supabase Database, Backups (point-in-time if the plan has it) or `pg_dump`. Restore only after confirming the target; restoring overwrites newer data.

## 5. Symptom, cause, action

| Symptom | Likely cause | Action |
|---|---|---|
| Everyone sees "Server unreachable" | API down or sleeping (free plan) or wrong API URL | open `<api>/health`; wait up to 1 minute for a cold start; check Render Logs; confirm `NEXT_PUBLIC_API_BASE_URL` |
| `/ready` shows `database: unavailable` | Supabase paused, wrong/rotated `DATABASE_URL`, connection limit | check Supabase health; verify the URL; use the pooled URI; redeploy |
| Everyone gets 401 | JWKS URL wrong, signing keys changed, clocks | check `SUPABASE_JWKS_URL` opens in a browser; redeploy API |
| One user gets 403 "No CampusOS profile" | profile row missing | link the user (section 4) |
| One user cannot see a class (faculty) | no teaching assignment | Admin, Academics, Teaching assignments |
| Browser CORS errors after a new domain | `CORS_ORIGINS` lacks the origin | add the exact origin, redeploy API |
| Attendance chip "N waiting to sync" stays | device offline, API sleeping, or expired sign-in | wait for online; tap the chip to retry; "Sign in again" if shown (records are kept) |
| Chip "N failed · retry" | server error or the faculty lost the assignment (403) | tap Retry; if 403/422 read the message, the marks stay on the device; fix the cause, then ask the faculty to re-save |
| Chip "N need review" | 409: a different record already exists for that class/date/period | Admin compares in Attendance (open the session) and corrects with a reason; the faculty device keeps its copy |
| Marks cannot be edited | locked, or in the wrong lifecycle stage | Admin unlocks with a reason; only draft is editable by faculty |
| Payment rejected | amount over outstanding, or idempotency key reused with a different amount | correct the amount; a retry of the same payment returns the same receipt |
| AI text says unavailable | no `AI_PROVIDER_API_KEY`, provider error, or output failed validation | expected and safe: the rule-based evidence is the authority |

## 6. Data safety rules

- Do not run `app.seed`, `alembic downgrade`, `DROP`/`TRUNCATE`, or `supabase db reset` on production.
- Audit events can only be read; there is no edit/delete in the API. Do not edit the table by hand.
- Attendance saved offline lives in the browser's IndexedDB until synced; clearing site data before it syncs loses it. Tell users to sync before clearing browser data.
- Student data in demos is synthetic except the specified sample record; do not load real student personal data into a demo environment.

## 7. Health-check script (copy and run)

```bash
API=https://<your-api>.onrender.com
curl -fsS $API/health && echo
curl -fsS $API/ready && echo     # expect "database":"ok"
curl -s -o /dev/null -w "unauthenticated /api/v1/me -> %{http_code} (expect 401)\n" $API/api/v1/me
```

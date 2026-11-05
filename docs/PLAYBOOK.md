# CampusOS playbook (step-by-step scenarios)

Each scenario lists who does it, exact steps and how to know it worked. Setup details are in [`deployment.md`](../deployment.md); operating tasks in [`RUNBOOK.md`](RUNBOOK.md).

## P1. Fresh setup on a new laptop (about 20 minutes, no accounts)

1. `git clone https://github.com/Sathvik2005/campusos.git` and `cd campusos`.
2. Backend: `cd backend`, `python -m venv .venv`, `.venv\Scripts\python -m pip install -r requirements.txt`, `.venv\Scripts\python -m pytest -q`. **Success:** `151 passed`.
3. Frontend: `cd ../frontend`, `npm install`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. **Success:** all pass, build lists the routes.
4. Browser tests: `npm run test:e2e -- --workers=1` (needs Microsoft Edge). **Success:** `12 passed`.
5. Run it: terminal 1 `cd backend; .venv\Scripts\python -m uvicorn app.main:app --port 8000`; terminal 2 `cd frontend; npm run dev`; open http://localhost:3000. **Success:** the sign-in page appears and says sign-in is not configured (no Supabase yet). To sign in, continue with `deployment.md` parts B to E.

## P2. Demo for a reviewer (10 minutes, needs P1 plus Supabase parts B to E)

Setup: two browser profiles (or one normal and one private window): one signed in as the **admin**, one as **faculty 1**.

| # | Who | Do | Expect |
|---|---|---|---|
| 1 | Admin | Students, type "Subhashree" | ENG-24-CSE-0412, open it: attendance 81.5%, internals 33/40, fee due ₹0.00 |
| 2 | Admin | Academics, add a faculty with an existing employee code | red inline message, nothing added |
| 3 | Faculty | Attendance, choose a class, Mark remaining present, flip two students to Absent/Late, Save | green "Saved and synced"; header chip **All synced** |
| 4 | Faculty | DevTools, Network, set **Offline**. Pick another period, Mark remaining present, Save | "Saved N records on this device"; chip **Offline · saved**; listed under "Saved on this device" as Waiting to sync |
| 5 | Faculty | Reload the page while still offline | the saved record is still listed (stored in IndexedDB) |
| 6 | Faculty | Set the network back to **No throttling** | within seconds the record shows Synced; chip **All synced** |
| 7 | Admin | Attendance, open the session, correct one student with a reason | "Correction saved and audited" |
| 8 | Admin | Marks, create "Internal 1" max 40 for a class | appears as Draft |
| 9 | Faculty | Marks, open it, type 41 for a student | "Max is 40", Save disabled; fix to 33, enter all, Save scores, Submit |
| 10 | Admin | Open it, Mark moderated, Lock marks | status Locked; table is read-only; Unlock needs a reason |
| 11 | Admin | Fees, open a student with dues, enter more than the due; then enter a partial amount and record it | the over-amount is blocked inline; the partial one shows "Payment recorded in demo mode" with a receipt and the balance drops |
| 12 | Admin | Student insights, pick a student, read evidence, Create mentor task, Approve | task appears under Mentor tasks; nothing was created before Approve |
| 13 | Admin | Audit | entries for the actions above; no edit/delete controls |

Say out loud while demoing: the risk category comes from fixed rules (75% attendance line; 65% and 40% are our documented choices); AI text, if configured, only explains the evidence and falls back safely.

## P3. Before every release (developer checklist)

```
cd backend  && .venv\Scripts\python -m pytest -q                       # all pass
cd backend  && .venv\Scripts\python -m alembic upgrade head && .venv\Scripts\python -m alembic check   # on a scratch SQLite: "No new upgrade operations"
cd frontend && npm run typecheck && npm run lint && npm test && npm run build
cd frontend && npm run test:e2e -- --workers=1
cd frontend && npm audit --omit=dev ; cd ../backend && .venv\Scripts\python -m pip_audit -r requirements.txt
git status          # clean; no .env files tracked
```
Then update `docs/EXECUTION_TRACKER.md`/`docs/STATUS.md`, commit, push. Deploy API first, web second; apply a migration (if any) between them, only after a backup and approval.

## P4. Incident: the site is down

1. Open `<api>/health`. No answer: Render Logs; free plan may be sleeping (wait 60 s).
2. `/health` ok but `/ready` not ok: database problem; check Supabase status and `DATABASE_URL`.
3. Web loads but sign-in fails: Supabase Auth status; the Site URL/Redirect URLs; `NEXT_PUBLIC_SUPABASE_*`.
4. Recently deployed? Roll back (Render Rollback, Vercel Promote previous).
5. Tell users: attendance marked meanwhile is safe on their devices and syncs when service returns.

## P5. A faculty member says "my attendance did not save"

1. Ask them to open Attendance and read "Saved on this device".
2. **Waiting to sync:** they are offline or the API is asleep: open the app with internet, tap the chip.
3. **Failed:** read the message. 500s: tap Retry. 403/422: they lost the assignment or the data is invalid; fix the assignment (Admin, Academics) and have them mark again; the old local record stays visible for reference.
4. **Needs review (conflict):** an Admin opens Attendance, finds the session for that class/date/period, and corrects it with a reason.
5. **Not listed at all:** they never pressed Save, or cleared browser data. Re-mark.
6. Verify on the server: Attendance (admin) shows the session; Audit shows the correction if any.

## P6. Wrong marks after locking

Admin: Marks, open the assessment, enter **Unlock reason**, Unlock; change scores (a reason is required for admin edits); Mark moderated; Lock again. Check the History list shows each step.

## P7. A secret leaked (key pasted in chat/Git)

1. Revoke/rotate it at the provider immediately (Supabase DB password, AI key, etc.).
2. Update Render/Vercel env, redeploy.
3. If it was committed, tell the maintainer; history rewrite is a separate, approved task.
4. Record it in the incident notes (without the secret).

## P8. Hand-over / grading checklist (what is real and what is not)

| Claim | Verified? | Where |
|---|---|---|
| Backend tests pass | Yes, 151 on SQLite | `pytest` |
| Frontend tests, lint, typecheck, build | Yes | P3 |
| Browser tests of the sign-in page and security headers | Yes, 12 | `npm run test:e2e` |
| Every API route requires auth; admin/faculty separation | Yes, automated matrix | `backend/tests/test_security_matrix.py` |
| Offline queue logic (IndexedDB write first, replay safe, conflict, auth expiry) | Yes in jsdom with fake-indexeddb | `lib/offline/offline.test.ts` |
| Offline attendance in a real signed-in browser | **Not yet** | do P2 steps 3 to 6 |
| PostgreSQL / Supabase end to end | **Not yet** | `deployment.md` B to E |
| Live AI explanations | **Not yet** (no key) | set `AI_PROVIDER_API_KEY` |
| Deployed URLs | **None** | `deployment.md` F to H |

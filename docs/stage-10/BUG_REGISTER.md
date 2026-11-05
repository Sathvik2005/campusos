# Bug register

| ID | Severity | Found | Status | Description / fix |
|---|---|---|---|---|
| B-01 | Medium | Stage 6 audit | Fixed | Vitest never unmounted components between tests (false failures). `cleanup` added in `vitest.setup.ts` |
| B-02 | Medium | Stage 6 audit | Fixed | With Supabase unconfigured, `/dashboard` stayed on a shell-less error page; now redirects to `/login` which explains the missing config (e2e + unit tested) |
| B-03 | High | Stage 9 | Fixed | Insights screen keyed risk badges on `high/moderate/low` while the API returns `on_track/watch/at_risk` (all badges would have rendered grey/raw). Now mapped via `riskLabel/riskTone` with tests |
| B-04 | Low | Stage 10 | Fixed | No baseline security headers on the frontend; added nosniff, frame deny, referrer and permissions policies (e2e verified) |
| B-05 | Low | Stage 7 | Fixed | Admin could not see a session's records to correct them; added scoped `GET /attendance/sessions/{id}` (404 for out-of-scope) |
| B-06 | Info | env | Open | Dev machine runs out of virtual memory; `fileParallelism:false` in Vitest and `--workers=1` for Playwright keep runs stable. Not a product defect |
| O-01 | Medium | Stage 10 | Open | No API rate limiting (login is Supabase-side; the API has none) |
| O-02 | Medium | Stage 10 | Open | No Content-Security-Policy (needs nonce setup for Next; deferred) |
| O-03 | Medium | Stage 7 | Open | Mentor task form lacks assignee picker and completion notes (API supports them) |
| O-04 | Low | Stage 7 | Open | Fees reconciliation totals are per page, not campus-wide |
| O-05 | Low | Stage 7 | Open | No student create/edit UI (API exists); no dashboard trend/activity cards |
| O-06 | Medium | Stage 8 | Open | No Service Worker: pending attendance syncs only when the app is next opened online |
| B-07 | High | Real run (local demo mode) | Fixed | Academics, Marks and Fees screens called `/api/v1/batches`, `/assessments`, `/accounts`... but the API mounts them under `/academic`, `/marks`, `/fees`. Mocked-fetch tests could not see it; every request would have been a 404. Fixed, plus a contract test that every `/api/v1` path in the UI exists in the backend route snapshot (`frontend/lib/api/api-contract.test.ts`, kept in sync by `backend/tests/test_api_paths_snapshot.py`) |
| B-08 | High | Real browser offline test | Fixed | Reloading the app while the API was unreachable showed an error instead of the app, hiding the attendance saved on the device (the profile call failed). The last confirmed profile (id, role, name; no token) is now cached and used only for the same session user; the API still authorises everything |
| B-09 | Medium | Phone screenshot | Fixed | Fees ledger overflowed the phone width by 19 px and clipped the Due column and summary figures; now a card list under 768 px and stacked summary cards |
| B-10 | Medium | Phone capture | Fixed | The faculty sticky Save bar sat underneath the bottom navigation on phones and could not be tapped; it now sits above it |
| B-11 | Low | Screenshot review | Fixed | Miso appeared on empty states of fees, marks and audit, which the brand rules forbid; those states now render without her |
| B-12 | Low | Screenshot review | Fixed | Admin attendance sessions rendered all 200 rows at once; now 30 with "Show more" |

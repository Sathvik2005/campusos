# Stage 8 report: offline attendance (2026-11-05)

## What was built
- `lib/offline/db.ts` Dexie DB `campusos`: `outbox` (one row per saved session; `id` = the client UUID idempotency key = payload key) and `meta` (cached class lists and rosters). Rows are tagged with `profileId`. **Deviation from the design doc:** `sessions` and `records` are folded into the outbox row's payload (identical to `POST /attendance/sync`), which keeps the write a single atomic IndexedDB put. No tokens and no fee data are stored.
- `lib/offline/outbox.ts` `enqueue` writes IndexedDB in one transaction before any network call; refuses a second local save for the same class/date/period.
- `lib/offline/sync.ts` single-flight runner; per-status handling table; exponential backoff (2s to 5min); manual retry; stale `syncing` rows reset on start.
- `lib/offline/cache.ts` network-first read cache; falls back to the last copy only on `NetworkError` (a 403 is never hidden by the cache).
- `features/offline/sync-provider.tsx` live IndexedDB view (Dexie `liveQuery`), triggers: mount, `online` event, tab visible, 30 s interval, manual.
- `features/offline/sync-chip.tsx` states conflict > failed > syncing > pending > offline > synced > online, bound to `navigator.onLine` + the real outbox counts. Rendered in the header on every viewport.
- Attendance screen: Save writes IndexedDB first, then syncs; "Saved on this device" list shows each record's true status with Retry and a conflict explanation. Nothing is auto-deleted.

## Response handling (tested table)
| Server/network answer | Result | Local data |
|---|---|---|
| 200/201 | synced | kept (marked synced) |
| network error | stays pending, queue stops, no retry burned | kept |
| 401 | stays pending, "Sign in again to sync" | kept |
| 5xx / 408 / 429 | failed, retryable with backoff | kept |
| 403 / 404 / 422 | failed, not retryable | kept |
| 409 | conflict, not retryable, no silent merge | kept |

## Evidence (commands run)
- Vitest 86/86 (adds 24 in `lib/offline/offline.test.ts` with fake-indexeddb, 3 chip tests, 5 attendance offline-first UI tests).
- Covered: IndexedDB write without network; survives simulated restart; duplicate local save refused; replay uses the same key; offline/5xx/403/409/401 handling; partial failure; single-flight; manual requeue; profile isolation (bob never sends alice's records); cache fallback per profile.
- Backend already had idempotency/409 tests (pytest 61).

## NOT verified (honest limits)
- **Playwright with a real browser, real IndexedDB and a real signed-in backend session:** BLOCKED (needs Supabase credentials). jsdom + fake-indexeddb is not a substitute for a real browser reload/close-reopen.
- Hosted-HTTPS offline behaviour, expired-token refresh flow, revoked-assignment path against the live API.
- No Service Worker: there is no background sync when the tab is closed; records sync the next time the app is opened online.
- Logout keeps records (never deleted); a different profile logging in on the same device does not see or send them (tested at the library level).

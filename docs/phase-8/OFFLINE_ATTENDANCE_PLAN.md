# CampusOS — Phase 8: Offline attendance plan (critical path)

**Objective:** Dexie queue, retries, duplicate safety and visible failures. Design: `phase-2/OFFLINE_SYNC_DESIGN.md`; rules PD-10, PD-20–23, PD-33, PD-34; acceptance BR-05 and AC-OFF-01–06. If time is short, freeze everything else (including AI) to protect this phase.

## 1. Build order
| Step | Work | Verification |
| --- | --- | --- |
| 8.1 | Dexie schema: `rosters`, `sessions`, `records`, `outbox` (tagged with `profileId`); no tokens or fee data | Vitest + fake-indexeddb |
| 8.2 | Roster cache on online load with `version` and `cachedAt`; "never cached" state blocks offline marking honestly | unit + Playwright |
| 8.3 | Save writes IndexedDB in one transaction **before** any network call; UI shows Pending | kill network, refresh, data still present |
| 8.4 | Sync runner: single-flight; triggers on `online`, visibility, interval, manual retry; exponential backoff with `nextRetryAt` | fake timers |
| 8.5 | Response handling: 200/201 → synced; 5xx/timeout → failed + retry; 401 → keep queue, re-login, never sync as another profile; 403/422 → non-retryable failed, retained; 409 → conflict, local kept, no silent merge | table-driven tests per status |
| 8.6 | Real SyncChip: states `online / offline / pending / syncing / synced / failed / conflict` bound to navigator + live outbox count; reachability = `navigator.onLine` plus a real request | component + Playwright |
| 8.7 | Failure UI: retry on the session, view local data, conflict explanation | Playwright |
| 8.8 | Logout keeps pending records; next login of a different profile does not sync them | unit |

## 2. Required scenarios (Playwright with real IndexedDB + real backend)
Load roster online → go offline → mark → refresh → close and reopen → pending remains → reconnect → auto sync → retry same operation → no duplicates; backend timeout; partial failure; conflicting server record; revoked assignment (403) → local preserved. Verify IndexedDB contents **and** server rows; a visual indicator alone is not proof.

## 3. Exit criteria
All scenarios above pass with evidence; replay creates zero duplicate rows; failure never deletes a local record; the Faculty mobile flow still completes in under 30 seconds with no extra offline steps.

## 4. Known honest limits (document, do not hide)
Hosted HTTPS offline behaviour may differ from local; record what was verified locally vs live. Roster must be cached while online first (PD-23). No background sync when the tab/app is closed unless Service Worker Background Sync is actually implemented.

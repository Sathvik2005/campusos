# CampusOS — Phase 2: Offline attendance sync

Critical path. Product rules PD-10, PD-20–23, PD-33.

## Local (Dexie)

- `rosters` — batch/subject, students {id, roll, name}, cachedAt, version  
- `sessions` — clientSessionId, natural key, idempotencyKey, syncStatus  
- `records` — clientRecordId, session, studentId, status, timestamps  
- `outbox` — op, payloadRef, idempotencyKey, retryCount, nextRetryAt, status, lastError  

Writes use IDB transactions. No tokens in IndexedDB.

## Flow

1. Online: load roster → cache.  
2. Mark + save → Dexie **before** network; UI pending.  
3. Survive refresh/restart.  
4. Sync on online, visibility, interval, manual retry. Single-flight (no overlapping sync).  
5. POST `/api/v1/attendance/sync` with Bearer + idempotency key + complete roster statuses.  
6. Synced only after 200/201 ACK.  
7. 5xx: failed, retain, exponential backoff.  
8. 401: retain queue, re-login; **do not sync as another user**.  
9. 403/422: non-retryable failed, retain for display.  
10. 409: conflict, retain local.

## Server

- Verify JWT + assignment + students in batch + complete roster + statuses in {present,absent,late}.  
- Unique `idempotency_key`: same payload → return existing; different payload → 409.  
- Unique natural key `(batch, subject, held_on, period)`: if exists for other key → 409.  
- Transaction insert session + records.

## UX states

`online | offline | pending | syncing | synced | failed | conflict`

Reachability: `navigator.onLine` **plus** health/sync request. Chip binds to queue, not decoration.

Logout: do not delete pending records; do not sync under a different profile (tag outbox with `profileId`).

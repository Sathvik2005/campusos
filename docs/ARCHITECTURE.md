# CampusOS — Architecture

**Shape:** Modular monolith.  
**Platform:** Next.js App Router (TypeScript) + Supabase + Vercel.  
**Signature subsystem:** Offline-first attendance with idempotent sync.

Do not introduce microservices, message brokers, or extra clouds. Prefer boring, testable boundaries.

---

## 1. System context

```
Faculty / Admin browsers
        │
        ▼
┌───────────────────┐     ┌─────────────────────┐
│  Next.js (Vercel) │────▶│  Supabase           │
│  App Router UI    │     │  Auth + Postgres    │
│  Server Actions / │     │  RLS policies       │
│  Route Handlers   │     └─────────────────────┘
│  AI explanation   │
│  (server only)    │               ▲
└────────┬──────────┘               │
         │                          │
         ▼                          │
┌───────────────────┐               │
│  Dexie / IndexedDB│── sync queue ─┘
│  attendance only  │   idempotent POSTs
└───────────────────┘
```

---

## 2. Application layers

| Layer | Responsibility | Must not |
| --- | --- | --- |
| `app/` UI | Role-aware screens, templates | Trust the client for authorization |
| `components/` | Shell, templates, shadcn restyles | Embed business writes |
| `lib/domain` | Pure functions: balances, risk rules, mark validation | Touch I/O |
| `lib/offline` | Dexie schema, queue, sync runner | Bypass server auth |
| `lib/server` | Actions, services, AI, audit | Expose service role to browser |
| `supabase/` | Migrations, RLS, seeds | Drift from this document |

---

## 3. AuthZ model

1. Supabase Auth session (email/password demo users).
2. `profiles.role` is `faculty` or `office_admin`.
3. Next.js middleware protects routes; **RLS is the real gate**.
4. Faculty: assigned subjects/batches only. Cannot write masters, fees, locks, or other faculty’s marks.
5. Office Admin: full campus scope for the single seeded campus. Cannot invent super-admin/multi-tenant powers.

Sensitive actions (lock marks, record payment, moderate, create mentor task) run as Server Actions that re-check role.

---

## 4. Offline attendance

### Local store (Dexie)

- `sessions` — class, subject, period, date, local status, `idempotencyKey`
- `records` — studentId, status, updatedAt, sessionKey
- `outbox` — operations waiting to sync

### Persistence guarantees

- Writes go to IndexedDB **before** any network attempt.
- Survive refresh, tab close, and browser restart.
- Outbox is the source of pending truth.

### Sync

1. Trigger on `online`, visibility, interval, and manual retry.
2. Each session POST includes `idempotencyKey` (UUID v4 created at first local save).
3. Server unique constraint on `idempotency_key`.
4. Duplicate POST returns the existing session (200/409-as-success), never a second roster.
5. Partial failure: keep local rows; mark outbox item `failed` with reason; do not delete.
6. After confirmed server ACK, mark local `synced` and drop outbox item.

### Status model (UI must bind to this, not decoration)

`online | offline | pending | syncing | synced | failed`

---

## 5. Marks, fees, risk

**Marks:** Faculty draft → submit → Admin moderate (reason required on change) → lock. Locked writes rejected for Faculty. Every write appends `marks_audit`.

**Fees:** `outstanding = total - sum(simulated payments)`. Payments require idempotency key. Receipts are generated records, not PDFs from a vendor. UI always says demo mode.

**Risk pipeline (ordered):**

1. Load verified metrics from DB.
2. Apply deterministic thresholds (`lib/domain/risk`).
3. Optionally call LLM with **only** those metrics + evidence.
4. Validate model JSON with Zod. On failure or timeout, store deterministic result + `explanation_status = unavailable`.
5. Mentor tasks are human-created rows. AI never inserts tasks or edits academics.

---

## 6. Routing (proposed)

```
/login
/                    → role overview
/students
/students/[id]
/academics
/attendance
/attendance/[sessionId]
/marks
/marks/[componentId]
/fees
/fees/[studentId]
/insights
/insights/[studentId]
```

Faculty hitting Admin routes receive 403, not an empty shell.

---

## 7. Data flow examples

**Attendance save offline**

UI → Dexie write → status pending → (no network) → banner “You're offline…”

**Reconnect**

`syncRunner` → POST `/api/attendance/sync` or server action → RLS + unique key → ACK → Dexie synced

**Lock marks**

Admin UI → server action `lockComponent` → role check → transaction lock + audit → Faculty UI read-only

---

## 8. AI integration

- Runs only on the server.
- No student raw PII beyond roll + academic metrics already in-app.
- Prompt: explain the deterministic category using provided evidence; do not change the category; do not invent history.
- Budget: small, timeout ~8s, single retry.
- Feature flag / missing key: skip LLM, keep rules.

---

## 9. Testing strategy

| Layer | Tool | Focus |
| --- | --- | --- |
| Domain | Vitest | Marks max, fee math, risk thresholds, idempotency helper |
| Offline | Vitest + fake-indexeddb | Queue survive, replay, no dupes |
| RLS | Supabase tests or SQL | Faculty cannot lock / pay / edit others |
| E2E | Playwright | Login, attendance offline/online, marks lock, mock payment |
| Visual | Playwright viewports | 1440, 768, 390, 360 overflow checks |

---

## 10. Deployment

- Vercel project + Supabase project (dev).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `AI_API_KEY` (server only).
- Seed script for demo users and CSE batch.
- TDD / ZIP for assignment hand-in after Phase 10.

---

## 11. What we explicitly will not build

- Client-side service role
- Fire-and-forget attendance POST without outbox
- AI writes to marks/attendance/fees
- Microservice for sync
- Real payment gateway

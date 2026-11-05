# CampusOS — Phase 1: Product decisions and assumptions

Decisions below **adopt Phase 0 defaults** unless marked as a new product rule. They are **not** claimed as existing client SOP. Anything still open is listed at the end.

**Stack (from Phase 0, not reopened here):** Next.js (TypeScript) → FastAPI → PostgreSQL (Supabase-hosted); Vercel + Render. Permissions enforced on the API. No student role in MVP.

---

## 1. Adopted product decisions

| ID | Decision | Source |
| --- | --- | --- |
| PD-01 | MVP = one campus, B.Tech CSE only, Faculty + Office Admin | Phase 0 |
| PD-02 | Attendance statuses = **Present, Absent, Late**. Late is recorded; it does **not** change percentage math differently from Absent unless a future policy says so. **MVP percentage treats Late as Present for “attended” count** (see PD-03) | Phase 0 Late status + new explicit rule |
| PD-03 | Attendance % = `(Present + Late) / (Present + Late + Absent) × 100` over **synced** sessions for that student in the current academic year. Pending local records do not change the official %. | New, documented assumption |
| PD-04 | Shortage / watch threshold: official % **< 75%** | Phase 0 / client-style rule |
| PD-05 | Stronger at-risk: official % **< 65%** **OR** internals **< 40% of component maximum sum** | Phase 0 |
| PD-06 | IA components in seed: **IA-1 and IA-2**, combined max **40** (Subhashree 33/40) | Phase 0 |
| PD-07 | Timezone for `held_on`, “today”, and same-day attendance: **Asia/Kolkata** | Phase 0 |
| PD-08 | Currency **INR**; all payments `kind = simulated` | Phase 0 |
| PD-09 | Outstanding = total plan amount − sum(successful simulated payments). Amount must be **> 0** and **≤ outstanding** | Phase 0 |
| PD-10 | Offline conflict: different idempotency keys, same natural session key, different payload → **HTTP 409**, local outbox retained, **no silent merge** | Phase 0 Q-07 |
| PD-11 | Same idempotency key replay → success, existing session, no duplicate rows | Phase 0 |
| PD-12 | Dashboard numbers are **this prototype campus**, never 7,800 / ₹95 cr trust figures | Phase 0 |
| PD-13 | AI never writes attendance, marks, fees, or tasks. Rules own `risk_category`. Missing AI key or timeout → explanation unavailable, rules still show | Phase 0 |
| PD-14 | Mentor tasks are created only by Office Admin action, never auto-inserted by the model | Phase 0 |
| PD-15 | Sample student Subhashree Mohanty / ENG-24-CSE-0412 / Year 2 / 81.5% / 33/40 / ₹0 is **exact** | Client |
| PD-16 | Seed ~48–80 additional fictional CSE students; no other programmes in the active dataset | Phase 0 |
| PD-17 | Miso only on login, empty, onboard, offline, friendly success — never on tables, fees, marks, audit, critical errors | Design system |
| PD-18 | Attendance screen has **no dashboard metric cards**. 30-second path once roster is loaded | Phase 0 / design |
| PD-19 | Do not claim DPDP compliance, real money movement, or client KPIs already achieved | Phase 0 |

---

## 2. New rules defined in Phase 1 (assumptions, not client law)

| ID | Decision | Rationale |
| --- | --- | --- |
| PD-20 | **Synced attendance is Faculty-read-only.** Faculty may freely edit **unsynced** local sessions. Office Admin may correct a synced session with a **mandatory reason**; that write is audited. | Avoids messy same-day edit races; still allows office corrections. |
| PD-21 | Natural session identity = **batch + subject + held_on + period**. One session per that tuple. | Duplicate prevention |
| PD-22 | Period is an integer **1–8**. Date defaults to today IST; Faculty may pick another date for the current academic year (backfill) but backfill of **already synced** sessions follows PD-20. | Needed for “class selection”; 8 periods is an assumption |
| PD-23 | Roster must be loaded (and cached) **while online** before offline marking is possible. If never loaded, UI explains that offline marking is unavailable. | Honest offline, not fake |
| PD-24 | Marks lifecycle: Faculty writes only in **draft**. **Submit** → Faculty read-only. Office Admin **moderate** (optional score fix + reason if scores change) then **lock**. | Matches Phase 0 lifecycle |
| PD-25 | **Unlock:** only Office Admin, mandatory reason, state returns to **moderated** (not draft). Faculty still cannot edit. Admin may correct and re-lock. | Prevents Faculty rewriting after lock |
| PD-26 | No mark **delete**. Corrections overwrite with audit of old/new. | Immutable history |
| PD-27 | Fees: **partial payments allowed**; **no refunds, no cash settlement, no gateway**. Receipt always watermarked Simulated / demo mode. | MVP honesty |
| PD-28 | Duplicate payment: same `idempotency_key` returns existing payment + receipt, no second debit. | Matches attendance pattern |
| PD-29 | Risk categories: `on_track`, `watch`, `at_risk`. Insufficient data does not invent history; `confidence` is `sufficient` / `limited` / `insufficient`. | Phase 0 |
| PD-30 | `watch` if 65% ≤ attendance < 75% and internals otherwise OK, **or** one metric missing but the other is concerning. `at_risk` if PD-05. `on_track` otherwise with enough data. | Explicit matrix |
| PD-31 | Official attendance % and internals used for directory, shortage, and risk come from **server (synced) data**, not the Faculty device outbox. | Single source of truth |
| PD-32 | Faculty **cannot** open Fees, Academic masters write, Insights mentor-create, or other faculty’s assignments. Faculty **may read** own students’ attendance/marks summaries on assigned subjects. Faculty **does not** see fee amounts. | Permission model |
| PD-33 | Session save requires **every roster student** to have a status (Mark all present is the fast path). Partial save is rejected. | Completeness / 30s workflow |
| PD-34 | “Mark all present” sets unmarked students to Present and leaves already marked Absent/Late untouched unless Faculty confirms “overwrite all to Present”. Default: **fill unmarked only**. | Safer default |
| PD-35 | Audit events required for: login success/failure (basic), attendance Admin corrections, marks score/lifecycle changes, payment create, risk assessment generate, mentor task create/complete. | Module J |
| PD-36 | Demo users only; passwords in private env, not in public README in plaintext if avoidable — README may list **usernames** and say password is in the private submission note. | Security vs evaluator UX — **open** if client requires plaintext demo password in TDD (likely yes for intern brief). Assumption: TDD includes demo password because evaluators need it; Git history should not contain production secrets. |

---

## 3. Explicitly not decided as client fact

- University attendance condonation rules beyond 75%.  
- Whether Late should count as Absent for shortage (we chose Present for %).  
- Real fee heads (tuition vs exam vs development) — MVP uses **one programme fee total**.  
- Who the “mentor” is (a user vs a text assignment) — MVP task is an Admin-owned to-do on a student, no Mentor role.  
- Multi-device Faculty login policy beyond 409 conflicts.

---

## 4. Open questions (do not block Phase 2 if defaults stand)

| ID | Question | Default if unanswered |
| --- | --- | --- |
| OQ-01 | Should Late count as Absent for shortage %? | **No** (PD-03) |
| OQ-02 | May Faculty backfill attendance for previous days? | **Yes**, unsynced or not-yet-existing sessions only |
| OQ-03 | Plaintext demo password in TDD? | **Yes**, labelled test-only |
| OQ-04 | Admin-created students in MVP UI or seed-only? | **Admin can create/edit** CSE students (P1); seed is enough for P0 demo |
| OQ-05 | Recompute risk on every attendance sync vs nightly? | **On demand + after marks lock / attendance admin correct** |

---

## 5. Conflicts check vs older root `docs/PRD.md`

Older PRD assumed Next/Supabase RLS as the backend. **Phase 0 + this file win.** Product behaviour (roles, modules, sample student, 75%, offline) is aligned; **implementation vehicle is FastAPI**.

# CampusOS — Phase 1: User journeys

Happy path, plus **alternate and failure** paths. Business rules: `PRODUCT_DECISIONS.md`. Test IDs: `ACCEPTANCE_CRITERIA.md`.

Status vocabulary for attendance connectivity (real, not decorative):

`online` · `offline` · `pending` · `syncing` · `synced` · `failed` · `conflict`

---

## J-01 Faculty login and class selection

1. Faculty opens `/login`, enters demo email/password.  
2. API authenticates; httpOnly session cookie set.  
3. Redirect to Faculty Overview.  
4. Faculty opens Attendance.  
5. System lists **assigned** subject–batch rows only.  
6. Faculty selects subject, date (default today IST), period 1–8.

**Alternate:** Already signed in → skip login.  
**Fail:** Wrong password → 401, form error, no enumeration of whether email exists beyond a generic failure.  
**Fail:** Faculty account disabled/missing assignment → Attendance empty state, not other people’s classes.  
**Fail:** Unauthenticated deep link → redirect login, then return.

---

## J-02 View roster

1. After J-01, system loads enrolled students for that batch (roll, name).  
2. If online, roster is persisted to IndexedDB cache.  
3. Faculty sees count vs marked count (0 initially).

**Fail:** Network error on first load → error with Retry; offline marking **disabled** until a cache exists (PD-23).  
**Empty:** No students in batch → empty copy, no fake rows.

---

## J-03 Mark attendance online

1. Roster visible. Status Online.  
2. Faculty uses Present / Absent / Late per student and/or Mark all present (fill unmarked).  
3. Save disabled until all students have a status (PD-33).  
4. Save writes server session (natural key + idempotency key).  
5. Success: Synced. Completion 100%.  
6. Faculty can leave; session is Faculty-read-only (PD-20).

**Fail:** Validation (missing marks) → inline, no save.  
**Fail:** 403 unassigned class → error, no local fake success.  
**Fail:** 409 period exists → “This period already exists”; do not duplicate.  
**Fail:** 5xx after local optimism — if we wrote local first, status Failed, data kept, Retry. Online path **still writes local first** so a blip does not lose the class.

**30-second target:** roster already loaded; mark-all + save.

---

## J-04 Mark attendance offline

1. Roster was cached earlier (J-02). Device goes offline.  
2. Banner: “You're offline. Your work is safe on this device.” Chip: Offline.  
3. Faculty marks and saves.  
4. Payload stored in Dexie outbox with UUID idempotency key. Status: Pending.  
5. Refresh / browser restart → pending session still there.

**Fail:** Never cached roster → cannot start session; explain need to open class once online.  
**Fail:** Storage quota → explicit error; do not pretend save succeeded.

---

## J-05 Reconnect and synchronise

1. Browser `online` (or manual Retry, or visibility).  
2. Sync runner sets Syncing.  
3. `POST /v1/attendance/sync` with idempotency key.  
4. 200 existing or created session → local Synced, outbox item removed **only for that key**.  
5. Copy: “All caught up. Nice work.”

**Fail:** Still 5xx → Failed, outbox retained, Retry visible.  
**Fail:** 401 mid-sync → keep outbox; prompt re-login; **do not delete**.

---

## J-06 Failed sync and conflicts

**Failed (retryable):** 408/429/5xx → Failed + reason + Retry. Local intact.

**Conflict 409 (PD-10):** Natural key taken by a **different** payload/key (e.g. another device already synced this period). UI: “Sync failed — this period already exists.” Faculty cannot overwrite. Admin can inspect server session and correct if needed (PD-20). Local copy retained for evidence until Faculty dismisses **after** acknowledging (dismiss does not delete until they confirm; default keep).

**Duplicate replay:** Same key → 200, treat as Synced.

**Partial roster on server vs local:** Session is all-or-nothing; server rejects incomplete; client should not send incomplete (PD-33).

---

## J-07 Enter internal marks

1. Faculty opens Marks, assigned subject, component (IA-1 or IA-2).  
2. Lifecycle **draft**.  
3. Enters scores; values > max or < 0 rejected inline.  
4. Save draft (server). Incomplete students allowed in **draft**.

**Fail:** 403 not assigned.  
**Fail:** Component already submitted/locked → read-only, no silent save.

---

## J-08 Submit for moderation

1. Faculty chooses Submit.  
2. Confirm: all enrolled students have a score.  
3. State → `submitted`. Faculty read-only.  
4. Admin Overview shows “Marks awaiting moderation.”

**Fail:** Missing scores → cannot submit.  
**Fail:** Network → draft remains draft; error toast.

---

## J-09 Moderate and lock

1. Admin opens submitted component.  
2. Reviews; if changing a score, **reason required**.  
3. Save moderation → `moderated`, audit old/new.  
4. Lock → `locked`, Faculty and Admin cannot edit scores. Copy: “Assessment secured. Changes are now restricted.”  
5. Audit panel lists events.

**Alternate:** Lock without score changes (still audited as lock).  
**Unlock (P1):** Admin reason → `moderated`, then correct, re-lock.  
**Fail:** Faculty lock API → 403.  
**Fail:** Edit while locked → 409/423 with message.

---

## J-10 View fee dues

1. Admin opens Fees or student profile.  
2. Sees total, paid, outstanding (PD-09).  
3. Search student; Subhashree shows ₹0 outstanding.

**Fail:** Faculty opens `/fees` or API → 403 / redirect.  
**Empty:** No payments yet → paid 0, outstanding = total.

---

## J-11 Record mock payment

1. Admin enters amount ≤ outstanding, confirms **demo mode**.  
2. Client sends idempotency key.  
3. Server inserts payment `kind=simulated`, updates computed outstanding.  
4. Copy: “Payment recorded in demo mode.”

**Fail:** amount 0, negative, or > outstanding → 422.  
**Fail:** duplicate key → return original payment, no double charge.  
**Fail:** Faculty → 403.

---

## J-12 Generate receipt

1. On success of J-11, receipt number `DEMO-RCPT-…` created.  
2. Admin opens receipt view (watermark Simulated).  
3. Optional browser print.

**Fail:** Missing payment → 404, no invented receipt.

---

## J-13 Detect student at risk

1. Admin opens Student Insights (or system refreshes after lock/attendance correct).  
2. Rules engine (PD-30) classifies using **server** attendance % and internals.  
3. List shows category + evidence (e.g. “Attendance 62% (<65%)”).  
4. Subhashree with 81.5% and 33/40 and ₹0 is **not** at_risk under PD-05.

**Fail:** Missing attendance history → confidence insufficient, disclose “No synced sessions yet”, do not invent trend.

---

## J-14 Review AI explanation

1. Admin opens a flagged student.  
2. If `AI_API_KEY` present, server sends **evidence only**; model returns explanation JSON.  
3. UI shows explanation + “Generated from recorded attendance and marks. It cannot change records.”  
4. Category on screen is still the **rule** category even if the model disagrees (drop model category field).

**Fail:** Timeout/invalid JSON/no key → “Explanation unavailable. The risk flag below is still based on college rules.” Rules block remains.

---

## J-15 Create mentor follow-up task

1. Admin clicks Create mentor task, title/notes, save.  
2. Task `open` linked to student (and optional assessment id).  
3. Admin can mark `done`.  
4. AI does not create this row.

**Fail:** Faculty POST task → 403.  
**Empty:** No tasks → empty state without childish copy.

---

## Cross-cutting journeys

**J-16 Admin login** — like J-01, lands on Admin Overview with prototype metrics.  
**J-17 Session expiry** — 401 on API → re-login; attendance outbox **retained**.  
**J-18 Responsive** — Faculty J-03 on 390px; Admin J-10 on 1440 and 360 (cards not overflowing tables).

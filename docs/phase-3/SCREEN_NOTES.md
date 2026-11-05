# CampusOS — Phase 3: Screen-by-screen design notes

Screen IDs from `SCREEN_INVENTORY.md`. Widths: 1440 / 1280 / 1024 / 768 / 390 / 360. Tokens and components are **not redefined here**; see `DESIGN_SYSTEM.md` and `RESPONSIVE_CONTRACT.md`. No new colours or fonts.

## S-01 Login
- ≥1024 asymmetric: wide editorial Midnight panel (wordmark, tagline "Campus life, in sync.", Miso) offset from a narrow Paper form column. Not 50/50.
- ≤768 centred form, small Miso above wordmark. Demo-account hint above the fold (labelled demo).
- Errors inline, plain language. No Miso on error text.

## S-02 / S-03 Overview
- Greeting + date + campus. Admin: four metrics (students, attendance today, outstanding dues, students to review), attention list (<75%, marks awaiting moderation), recent activity. Faculty: today's assigned classes first, one "Start attendance" action, own pending/failed sync items.
- Numbers come from prototype data; label nothing as a client KPI.
- 1024: metrics 2×2. ≤390: greeting, 2×2 metrics, attention, activity; no charts.

## S-04 Students
- Search-first (name or roll), batch filter. ≥1024 table with 48px rows, right-aligned numeric %; optional 420px detail drawer. 768 fewer columns. ≤390 card list; detail is a full-screen route.
- Faculty view omits any fee column.

## S-05 Profile
- Identity header, attendance % (official/synced only, shortage pill under 75%), internals x/40, Admin-only dues block. Sample record must read Subhashree Mohanty · ENG-24-CSE-0412 · Year 2 · 81.5% · 33/40 · ₹0.
- Tabular numerals for %, marks, money.

## S-07 Academics
- Settings workspace: ≥1024 left section nav + form cards; ≤768 accordion, full-width forms. Sections: programme, academic year, batch, subjects, faculty, assignments. Duplicate → inline 409 message.

## S-08 / S-09 Attendance (flagship)
- No metric cards. Context first: subject, batch, period, date (default today IST), sync chip.
- ≥1280 context column 280px + roster right. 1024/768 compact header + full-width roster. ≤390 header + sticky 40px sync bar; roster rows with name (body-lg), roll (caption), three ≥44px buttons Present/Absent/Late; sticky footer with Save; "Mark all present" under header and in footer. Bottom nav hidden on this view; explicit back control.
- "Mark all present" fills unmarked only (PD-34). Save disabled until every student has a status (PD-33), with a count of remaining.
- Offline: banner in flow, save writes Dexie first, row shows Pending. Failed: retry on session, local data kept. Conflict: explain, keep local, no silent merge. Roster never cached: honest message, offline marking unavailable (PD-23).
- Target: under 30 seconds once roster loaded; offline adds no steps.

## S-10 Attendance correction (Admin)
- Table of sessions; edit opens dialog/sheet with required reason field; audited.

## S-11 / S-12 Marks
- ≥1280 toolbar (component selector, max marks, lifecycle pill) + dense grid + audit rail right. 768–1024 audit below. ≤390 component picker then per-student stepper list; locked banner on top.
- Input rejects > max or < 0 immediately with message below the field. Locked: read-only for everyone except Admin unlock-with-reason flow.
- Actions by state: F draft→Submit; A submitted→Moderate→Lock; A locked→Unlock (reason).

## S-13 / S-14 / S-15 Fees
- Summary strip Total / Paid / Outstanding (money emphasised, charts avoided), search, ledger table, receipt panel (≥1024). ≤768 summary stacked, search, "Record payment" CTA, card timeline; receipt as sheet.
- Every amount context shows "Simulated" caption. Amount field blocks ≤0 and >outstanding. Retry uses the same idempotency key.
- No Miso anywhere on these screens.

## S-16 / S-17 Insights
- ≥1024 flagged list left, evidence right. ≤768 list then drill-in. Calm colours (amber/neutral), not red wash.
- Evidence block lists the rule inputs and `rule_version`. Explanation labelled "AI-generated explanation" only when it truly came from the model; otherwise "Rule-based summary" with the deterministic text. Confidence shown as sufficient/limited/insufficient. "Create mentor task" is an explicit Admin action.

## S-18 Audit
- Students-style table: when, actor, action, entity, reason. Read-only. ≤390 card list. No Miso.

## S-19 Global
- 401 → login with return path. 403 and 404 plain pages. Offline banner persistent. Error boundary shows retry; no stack trace.

## Accessibility notes per screen type
- 44px touch targets; visible lilac focus ring; labels always visible; status pills carry text, not colour alone; dialogs trap focus and return it on close; tables have headers and captions; honour `prefers-reduced-motion`.

# Screenshots, explained

Every image below is a real capture of the running CampusOS app (Next.js production build + the real FastAPI backend + a SQLite database seeded with synthetic data and the one sample student from the brief). They were taken by [`tools/capture-screens.cjs`](../../tools/capture-screens.cjs) in a real browser (Microsoft Edge via Playwright), desktop at 1440 px and phone at 390 px (2x pixel density).

## How these were produced (and what that does and does not prove)

No Supabase project was available, so the app was run in **local demo mode**: `backend/tools/local_demo_server.py` starts the real API with a locally generated signing key, and the capture script puts a token signed by that key into the browser. The API still verifies signature, audience, expiry, the user's profile and role on every request, exactly as in production; only the source of the public key differs. The demo server refuses to run unless the database is SQLite and `APP_ENV` is not production.
This proves the screens render real data from the real backend. It does **not** prove Supabase sign-in, PostgreSQL, or a hosted deployment.

To reproduce: see [`deployment.md`](../../deployment.md) part A for the normal run; for local demo mode run the commands in the docstring of `backend/tools/local_demo_server.py`, start the frontend (production build) with `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`, then `node tools/capture-screens.cjs <tokens.json> docs/screenshots`.

## The offline proof, in plain numbers

From [`capture-log.txt`](capture-log.txt) (written by the script, not edited):

```text
online save visible in 86 ms
IndexedDB outbox before reload: [{"status":"synced","period":8,"n":41},{"status":"pending","period":7,"n":41}]
IndexedDB outbox after reload (API still unreachable): [{"status":"synced","period":8},{"status":"pending","period":7}]
server sessions for offline period 7 today: 1 (expect 1)
after reload + another sync tick, sessions for that period: 1 (expect 1)
online save visible in 68 ms
IndexedDB outbox before reload: [{"status":"synced","period":6,"n":41},{"status":"pending","period":5,"n":41}]
IndexedDB outbox after reload (API still unreachable): [{"status":"synced","period":6},{"status":"syncing","period":5}]
server sessions for offline period 5 today: 1 (expect 1)
after reload + another sync tick, sessions for that period: 1 (expect 1)
```

## Screens

### Faculty

#### Faculty: pick a class and see the roster

<p><img src="f05-faculty-attendance-roster-desktop.png" alt="Faculty: pick a class and see the roster, desktop" width="560"> &nbsp; <img src="f05-faculty-attendance-roster-mobile.png" alt="Faculty: pick a class and see the roster, phone" width="190"></p>

**What you see.** Faculty signed in. The class and subject list shows only what this teacher is assigned to. Choosing one loads the roster (and caches it on the device). Date defaults to today, period to 1.

**Why it is designed this way.** Task-first screen: one decision (which class), then the roster. Nothing decorative competes with the job. Cards, not a table, on a phone so each student gets full-width tap targets.

#### Faculty: mark everyone

<p><img src="f06-faculty-attendance-marked-desktop.png" alt="Faculty: mark everyone, desktop" width="560"> &nbsp; <img src="f06-faculty-attendance-marked-mobile.png" alt="Faculty: mark everyone, phone" width="190"></p>

**What you see.** 'Mark remaining present' fills everyone not yet touched; two students were then changed to Absent and Late. The bar at the bottom counts P/A/L live and shows how many are left.

**Why it is designed this way.** Present/Absent/Late buttons are 48 px tall so a thumb can hit them in a moving classroom. Save stays disabled until every student has a status, so a half-marked register can never be saved by accident. Target: under 30 seconds per class.

#### Faculty: saved and synced

<p><img src="f07-faculty-attendance-synced-desktop.png" alt="Faculty: saved and synced, desktop" width="560"> &nbsp; <img src="f07-faculty-attendance-synced-mobile.png" alt="Faculty: saved and synced, phone" width="190"></p>

**What you see.** After Save the record went to IndexedDB first, then to the server. The green message and the header chip both say it is synced.

**Why it is designed this way.** The chip in the header is bound to real state (browser connectivity plus the IndexedDB outbox), not decoration. 'Saved and synced' appears only after the server answered.

#### Offline: saved on this device

<p><img src="f08-faculty-offline-saved-on-device-desktop.png" alt="Offline: saved on this device, desktop" width="560"> &nbsp; <img src="f08-faculty-offline-saved-on-device-mobile.png" alt="Offline: saved on this device, phone" width="190"></p>

**What you see.** The API was made unreachable. Save still worked: the message says the records are on this device, the 'Saved on this device' list shows 'Waiting to sync', and the chip says N waiting to sync.

**Why it is designed this way.** Weak classroom Wi-Fi is the brief's hard part. The teacher is never blocked or lied to: the screen says exactly where the data is.

#### Offline: still there after a page reload

<p><img src="f09-faculty-offline-after-reload-desktop.png" alt="Offline: still there after a page reload, desktop" width="560"> &nbsp; <img src="f09-faculty-offline-after-reload-mobile.png" alt="Offline: still there after a page reload, phone" width="190"></p>

**What you see.** The page was reloaded while the API was still unreachable. The saved attendance is read back from the browser's IndexedDB and listed again as waiting.

**Why it is designed this way.** Proves persistence is real storage, not React state. The roster comes from the cached copy (the screen says so).

#### Reconnected: synced once

<p><img src="f10-faculty-reconnected-synced-desktop.png" alt="Reconnected: synced once, desktop" width="560"> &nbsp; <img src="f10-faculty-reconnected-synced-mobile.png" alt="Reconnected: synced once, phone" width="190"></p>

**What you see.** The API came back and the chip was tapped. The record became Synced and the chip returned to 'All synced'. The server holds exactly one session for that class and period (see capture-log.txt).

**Why it is designed this way.** Replay safety: the same client UUID is sent, so a retry can never create a duplicate.

#### Faculty: overview

<p><img src="f01-faculty-overview-desktop.png" alt="Faculty: overview, desktop" width="560"> &nbsp; <img src="f01-faculty-overview-mobile.png" alt="Faculty: overview, phone" width="190"></p>

**What you see.** A short, role-shaped summary: assigned classes and sessions recorded.

**Why it is designed this way.** Faculty see no money and no campus-wide numbers. The overview is deliberately quiet.

#### Faculty: students in my classes

<p><img src="f02-faculty-students-desktop.png" alt="Faculty: students in my classes, desktop" width="560"> &nbsp; <img src="f02-faculty-students-mobile.png" alt="Faculty: students in my classes, phone" width="190"></p>

**What you see.** Search and class filter over only the students in this teacher's assigned classes.

**Why it is designed this way.** A directory pattern: search first, rows second. Out-of-scope students do not exist for this user (the API answers 404).

#### Faculty: internal assessments

<p><img src="f03-faculty-marks-list-desktop.png" alt="Faculty: internal assessments, desktop" width="560"> &nbsp; <img src="f03-faculty-marks-list-mobile.png" alt="Faculty: internal assessments, phone" width="190"></p>

**What you see.** The assessments for this teacher's classes with their lifecycle status.

**Why it is designed this way.** Status is text as well as colour (Draft, Submitted, Moderated, Locked).

#### Faculty: entering marks

<p><img src="f04-faculty-marks-entry-desktop.png" alt="Faculty: entering marks, desktop" width="560"> &nbsp; <img src="f04-faculty-marks-entry-mobile.png" alt="Faculty: entering marks, phone" width="190"></p>

**What you see.** A spreadsheet-like table, one row per student, with the maximum shown in the header. Inputs validate as you type (negative, above maximum, more than 2 decimals).

**Why it is designed this way.** Errors appear inline beside the cell before any request is made; the server repeats the same rules.

### Office Admin

#### Office Admin: overview

<p><img src="a01-admin-overview-desktop.png" alt="Office Admin: overview, desktop" width="560"> &nbsp; <img src="a01-admin-overview-mobile.png" alt="Office Admin: overview, phone" width="190"></p>

**What you see.** Campus numbers from the real database: active students, students below 75 % attendance, outstanding dues (marked simulated), students to review and open mentor tasks.

**Why it is designed this way.** Editorial hierarchy: a greeting, then four numbers with one-line notes. White space and a restrained palette (Midnight, Paper, Lilac, Mint).

#### Office Admin: student directory

<p><img src="a02-admin-students-desktop.png" alt="Office Admin: student directory, desktop" width="560"> &nbsp; <img src="a02-admin-students-mobile.png" alt="Office Admin: student directory, phone" width="190"></p>

**What you see.** Search by name or roll number, filter by class, paginated list with status pills.

**Why it is designed this way.** Linear-style list: dense enough for daily use, calm enough for all day. Each row is one big link.

#### Office Admin: student profile (sample student)

<p><img src="a03-admin-student-detail-desktop.png" alt="Office Admin: student profile (sample student), desktop" width="560"> &nbsp; <img src="a03-admin-student-detail-mobile.png" alt="Office Admin: student profile (sample student), phone" width="190"></p>

**What you see.** Subhashree Mohanty, ENG-24-CSE-0412: attendance 81.5 %, internals 33/40, fee due ₹0. These are the figures the client specified.

**Why it is designed this way.** Three numbers, no clutter. The fee card appears only for the Office Admin; faculty never receive it.

#### Office Admin: academic masters

<p><img src="a04-admin-academics-desktop.png" alt="Office Admin: academic masters, desktop" width="560"> &nbsp; <img src="a04-admin-academics-mobile.png" alt="Office Admin: academic masters, phone" width="190"></p>

**What you see.** Academic years, classes, subjects, faculty and teaching assignments, each as a list with an add form. Duplicates come back as an inline message.

**Why it is designed this way.** A settings pattern: list above, form below, one section per master. Deactivate instead of delete keeps history intact.

#### Office Admin: recorded sessions

<p><img src="a05-admin-attendance-sessions-desktop.png" alt="Office Admin: recorded sessions, desktop" width="560"> &nbsp; <img src="a05-admin-attendance-sessions-mobile.png" alt="Office Admin: recorded sessions, phone" width="190"></p>

**What you see.** Every session faculty have saved, with subject, class, period and date.

**Why it is designed this way.** Admins do not take attendance; they review and, when needed, correct it.

#### Office Admin: correct a session

<p><img src="a06-admin-attendance-correction-desktop.png" alt="Office Admin: correct a session, desktop" width="560"> &nbsp; <img src="a06-admin-attendance-correction-mobile.png" alt="Office Admin: correct a session, phone" width="190"></p>

**What you see.** Opening a session shows each student with Present/Absent/Late. Changes are highlighted, a reason is mandatory and Save is disabled until one is typed.

**Why it is designed this way.** Corrections are audited server-side (old and new values plus the reason). Only changed students are sent.

#### Office Admin: assessments

<p><img src="a07-admin-marks-list-desktop.png" alt="Office Admin: assessments, desktop" width="560"> &nbsp; <img src="a07-admin-marks-list-mobile.png" alt="Office Admin: assessments, phone" width="190"></p>

**What you see.** All internal assessments across classes with their lifecycle state, plus a form to create one.

**Why it is designed this way.** One consistent list pattern across modules (students, assessments, audit).

#### Office Admin: marks and moderation

<p><img src="a08-admin-marks-detail-desktop.png" alt="Office Admin: marks and moderation, desktop" width="560"> &nbsp; <img src="a08-admin-marks-detail-mobile.png" alt="Office Admin: marks and moderation, phone" width="190"></p>

**What you see.** Scores for a class, the lifecycle actions available at this state (moderate, lock, unlock), and the change history.

**Why it is designed this way.** Locked marks are read-only for everyone until an admin unlocks with a reason. The history list is the exam-audit trail.

#### Office Admin: fees ledger

<p><img src="a09-admin-fees-ledger-desktop.png" alt="Office Admin: fees ledger, desktop" width="560"> &nbsp; <img src="a09-admin-fees-ledger-mobile.png" alt="Office Admin: fees ledger, phone" width="190"></p>

**What you see.** Billed, collected and outstanding for each student, plus page totals. The screen says the ledger is simulated.

**Why it is designed this way.** Fintech-style tabular numbers aligned right. Each name links to the account.

#### Office Admin: a fee account

<p><img src="a10-admin-fee-account-desktop.png" alt="Office Admin: a fee account, desktop" width="560"> &nbsp; <img src="a10-admin-fee-account-mobile.png" alt="Office Admin: a fee account, phone" width="190"></p>

**What you see.** Balance cards and the payment history for one student (the sample student has nothing due).

**Why it is designed this way.** Every amount is labelled simulated; no real money moves.

#### Office Admin: record a payment (demo)

<p><img src="a11-admin-fee-payment-form-desktop.png" alt="Office Admin: record a payment (demo), desktop" width="560"> &nbsp; <img src="a11-admin-fee-payment-form-mobile.png" alt="Office Admin: record a payment (demo), phone" width="190"></p>

**What you see.** A student with dues: the form accepts a partial amount, rejects more than the balance, and shows a receipt in demo mode.

**Why it is designed this way.** Retrying a failed payment reuses its idempotency key, so a double click cannot charge twice.

#### Office Admin: payment recorded in demo mode

<p><img src="a11b-admin-fee-payment-receipt-desktop.png" alt="Office Admin: payment recorded in demo mode, desktop" width="560"> &nbsp; <img src="a11b-admin-fee-payment-receipt-mobile.png" alt="Office Admin: payment recorded in demo mode, phone" width="190"></p>

**What you see.** After pressing the button the screen confirms the simulated payment with a receipt number and the balance drops.

**Why it is designed this way.** Friendly, factual feedback ('Payment recorded in demo mode'); the receipt is stored on the server and can be fetched again without a second charge.

#### Office Admin: student insights

<p><img src="a12-admin-insights-evidence-desktop.png" alt="Office Admin: student insights, desktop" width="560"> &nbsp; <img src="a12-admin-insights-evidence-mobile.png" alt="Office Admin: student insights, phone" width="190"></p>

**What you see.** Students flagged by the rules, with the evidence behind each flag, thresholds, calculation history and a clear note when AI text is unavailable.

**Why it is designed this way.** Rules decide the category; the screen shows the numbers that triggered it. AI, when configured, may only explain that evidence.

#### Office Admin: approve a mentor task

<p><img src="a13-admin-mentor-task-approval-desktop.png" alt="Office Admin: approve a mentor task, desktop" width="560"> &nbsp; <img src="a13-admin-mentor-task-approval-mobile.png" alt="Office Admin: approve a mentor task, phone" width="190"></p>

**What you see.** The suggested task is pre-filled but editable; nothing is created until 'Approve and create task' is pressed.

**Why it is designed this way.** Human in the loop: an at-risk flag can only ever lead to a task a person approved.

#### Office Admin: audit history

<p><img src="a14-admin-audit-desktop.png" alt="Office Admin: audit history, desktop" width="560"> &nbsp; <img src="a14-admin-audit-mobile.png" alt="Office Admin: audit history, phone" width="190"></p>

**What you see.** A read-only list of who did what and when, filterable by record type.

**Why it is designed this way.** No edit or delete controls exist, because the API has no such route.

## Sign-in and not-found pages

#### Sign-in, desktop

<img src="login-desktop.png" alt="Sign-in, desktop" width="520">

Without Supabase settings the page says so plainly and disables the button; no fake login.

#### Sign-in, phone

<img src="login-mobile.png" alt="Sign-in, phone" width="520">

The form recomposes to one column; inputs are at least 44 px tall.

#### Not-found page

<img src="not-found-desktop.png" alt="Not-found page" width="520">

Friendly, with a way back; no stack traces.

## Design system in one paragraph

One shell, seven page templates (overview, directory, settings, task-first attendance, spreadsheet marks, ledger fees, evidence insights). Palette: Midnight `#111827`, Paper `#F5F3EF`, Lilac `#C4B5FD`, Mint `#D1FAE5`. Manrope for headings, Inter for body, tabular numerals for marks, money and percentages. Lucide icons. Controls are 44 px minimum on touch, labels are always visible, and status is always text as well as colour. Miso the cat appears only on sign-in and friendly empty states, never in tables, fees, marks or audit.

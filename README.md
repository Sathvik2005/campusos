<div align="center">

# campus**OS**

### *Campus life, in sync.*

**An offline-first academic operations workspace.** Faculty take attendance in a dead-Wi-Fi classroom. The office locks marks with a paper trail. Nobody loses a single tick.

<br>

![Next.js](https://img.shields.io/badge/Next.js-16-111827?logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Pydantic_v2-111827?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-111827?logo=postgresql&logoColor=white)
![Offline](https://img.shields.io/badge/offline-IndexedDB_outbox-C4B5FD?labelColor=111827)
![Tests](https://img.shields.io/badge/tests-153_backend_·_129_frontend_·_12_browser-D1FAE5?labelColor=111827)
![Audit](https://img.shields.io/badge/npm_audit_·_pip--audit-0_known_vulns-D1FAE5?labelColor=111827)

<br>

<img src="docs/screenshots/f08-faculty-offline-saved-on-device-mobile.png" alt="Phone screen: attendance saved on the device while the server is unreachable" width="260">
&nbsp;&nbsp;
<img src="docs/screenshots/a01-admin-overview-desktop.png" alt="Office Admin overview on desktop" width="620">

<sub>Left: a faculty phone with the API unreachable, attendance safely saved on the device. Right: the Office Admin's overview. Both are real screenshots of the running app (see <a href="docs/screenshots/README.md">how they were taken</a>).</sub>

</div>

---

> 🐈‍⬛ **Hi, I'm Miso, the office cat.** I'll walk you around. The short version: teachers mark attendance on a phone, even when the Wi-Fi gives up; the office moderates and locks marks and every change is written down; fees are a simulated ledger; and a plain set of rules (not a chatbot) flags students who may need a mentor. Everything below is real and tested. Where something is *not* done, I'll say so out loud.

## Contents
[The one-minute tour](#-the-one-minute-tour) · [Screens](#-every-screen) · [How it works](#-how-it-works-pictures-first) · [Project map](#-project-map) · [Run it](#-run-it) · [Proof](#-proof-not-promises) · [Honest limits](#-honest-limits) · [Docs](#-docs-worth-opening)

## 🚀 The one-minute tour

| You are… | You can… | Where |
|---|---|---|
| 🧑‍🏫 **Faculty** | See only your classes · mark everyone Present / Absent / Late in one tap each · save with no signal · enter marks and submit them | Attendance, Marks, Students |
| 🧾 **Office Admin** | Set up the year, classes, subjects, faculty · correct attendance (with a reason) · moderate, lock, unlock marks · record simulated payments · read the evidence for at-risk students · read the audit log | Academics, Fees, Insights, Audit |

**The three promises the code keeps**

1. 💾 **Never lose attendance.** Save writes to the browser's IndexedDB *first*. The network is a bonus.
2. 🔁 **Replay is a no-op.** Every save carries a client UUID; the server answers "already have it" instead of making a duplicate.
3. 🧮 **Rules decide, AI only explains.** Risk categories come from fixed, versioned rules. An optional AI sentence must pass validation or it is thrown away.

## 🖼 Every screen

Real captures from the running app, seeded with synthetic data plus the one sample student from the brief (Subhashree Mohanty, ENG-24-CSE-0412, 81.5 %, 33/40, fee due ₹0). Phone shots are 390 px wide; every image has an explanation in [`docs/screenshots/README.md`](docs/screenshots/README.md).

### Faculty, on a phone first

| Pick a class | Mark everyone | Saved & synced |
|:--:|:--:|:--:|
| <img src="docs/screenshots/f05-faculty-attendance-roster-mobile.png" width="220"> | <img src="docs/screenshots/f06-faculty-attendance-marked-mobile.png" width="220"> | <img src="docs/screenshots/f07-faculty-attendance-synced-mobile.png" width="220"> |
| The roster loads and is cached on the device. | Huge tap targets, a sticky Save bar, live P/A/L counts. | The header chip turns **All synced**. |

### When the connection dies

| API unreachable → saved locally | Page reloaded, still there | Back online → synced once |
|:--:|:--:|:--:|
| <img src="docs/screenshots/f08-faculty-offline-saved-on-device-mobile.png" width="220"> | <img src="docs/screenshots/f09-faculty-offline-after-reload-mobile.png" width="220"> | <img src="docs/screenshots/f10-faculty-reconnected-synced-mobile.png" width="220"> |
| "Saved on this device", chip says *waiting to sync*. | Read straight from IndexedDB after a real browser reload. | One tap on the chip; the server ends up with exactly one session. |

### Office Admin, on a desktop

| Overview | Students | Student profile |
|:--:|:--:|:--:|
| <img src="docs/screenshots/a01-admin-overview-desktop.png" width="300"> | <img src="docs/screenshots/a02-admin-students-desktop.png" width="300"> | <img src="docs/screenshots/a03-admin-student-detail-desktop.png" width="300"> |
| **Academics** | **Attendance sessions** | **Correction (reason required)** |
| <img src="docs/screenshots/a04-admin-academics-desktop.png" width="300"> | <img src="docs/screenshots/a05-admin-attendance-sessions-desktop.png" width="300"> | <img src="docs/screenshots/a06-admin-attendance-correction-desktop.png" width="300"> |
| **Marks list** | **Marks detail** | **Fees ledger** |
| <img src="docs/screenshots/a07-admin-marks-list-desktop.png" width="300"> | <img src="docs/screenshots/a08-admin-marks-detail-desktop.png" width="300"> | <img src="docs/screenshots/a09-admin-fees-ledger-desktop.png" width="300"> |
| **Fee account** | **Record a (simulated) payment** | **Insights: the evidence** |
| <img src="docs/screenshots/a10-admin-fee-account-desktop.png" width="300"> | <img src="docs/screenshots/a11-admin-fee-payment-form-desktop.png" width="300"> | <img src="docs/screenshots/a12-admin-insights-evidence-desktop.png" width="300"> |
| **Mentor task needs approval** | **Audit history** | |
| <img src="docs/screenshots/a13-admin-mentor-task-approval-desktop.png" width="300"> | <img src="docs/screenshots/a14-admin-audit-desktop.png" width="300"> | |

<details>
<summary><b>📱 Admin screens on a phone</b> (same pages, recomposed, no sideways scrolling)</summary>
<br>

| Overview | Students | Fees | Insights | Audit |
|:--:|:--:|:--:|:--:|:--:|
| <img src="docs/screenshots/a01-admin-overview-mobile.png" width="150"> | <img src="docs/screenshots/a02-admin-students-mobile.png" width="150"> | <img src="docs/screenshots/a09-admin-fees-ledger-mobile.png" width="150"> | <img src="docs/screenshots/a12-admin-insights-evidence-mobile.png" width="150"> | <img src="docs/screenshots/a14-admin-audit-mobile.png" width="150"> |

</details>

<details>
<summary><b>🧑‍🏫 More faculty screens</b> (overview, students, marks entry)</summary>
<br>

| Overview | Students | Marks list | Marks entry |
|:--:|:--:|:--:|:--:|
| <img src="docs/screenshots/f01-faculty-overview-desktop.png" width="220"> | <img src="docs/screenshots/f02-faculty-students-desktop.png" width="220"> | <img src="docs/screenshots/f03-faculty-marks-list-desktop.png" width="220"> | <img src="docs/screenshots/f04-faculty-marks-entry-desktop.png" width="220"> |

</details>

## 🧠 How it works, pictures first

### The big picture

```mermaid
flowchart LR
  subgraph Browser["📱 Browser (Next.js)"]
    UI["Screens<br/>TanStack Query"]
    IDB[("IndexedDB<br/>outbox + cached rosters")]
    UI <--> IDB
  end
  subgraph Cloud["☁️ Hosted"]
    API["FastAPI<br/>the ONLY writer"]
    DB[("PostgreSQL<br/>Supabase")]
    AUTH["Supabase Auth<br/>issues JWTs"]
  end
  UI -- "HTTPS + Bearer JWT" --> API
  API -- "SQL" --> DB
  AUTH -. "JWKS public keys" .-> API
  UI -. "sign-in only" .-> AUTH
```

The browser never talks to the database and never holds a service-role key.

### Offline attendance: the hard part

```mermaid
sequenceDiagram
  autonumber
  actor T as Teacher
  participant UI as Attendance screen
  participant DB as IndexedDB (outbox)
  participant R as Sync runner
  participant API as FastAPI
  T->>UI: Mark everyone, press Save
  UI->>DB: write session (client UUID = idempotency key)
  UI-->>T: "Saved on this device" (instant)
  R->>API: POST /attendance/sync (same UUID)
  alt network down / 5xx
    API--xR: no answer
    R-->>DB: keep it, retry with backoff (2 s … 5 min)
  else 200 / 201
    API-->>R: session saved (replay = 200, no duplicate)
    R-->>DB: mark synced
  else 409 conflict
    API-->>R: different record already exists
    R-->>DB: mark "needs review", never merge silently
  end
```

| Server says | The device does | Your marks |
|---|---|---|
| 200 / 201 | marks it **synced** | kept |
| network error | stays **waiting**, queue pauses | kept |
| 401 | "Sign in again to sync" | kept |
| 5xx / 408 / 429 | **failed**, retries with backoff | kept |
| 403 / 404 / 422 | **failed**, won't auto-retry | kept |
| 409 | **needs review** | kept |

### Marks can't be quietly changed

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted: faculty submits<br/>(every student scored)
  Submitted --> Moderated: admin moderates
  Moderated --> Locked: admin locks
  Locked --> Moderated: admin unlocks<br/>(reason required)
  note right of Locked: read-only for everyone
```

Every score and every state change writes a history row you can read on the marks page.

### Who is "at risk"? Rules decide.

```mermaid
flowchart TD
  A["Attendance % and internal marks"] --> B{"Any data?"}
  B -- no --> I["Insufficient data"]
  B -- yes --> C{"Attendance < 65 %<br/>or internals < 40 % of max?"}
  C -- yes --> H["🔴 High"]
  C -- no --> D{"Attendance < 75 %?"}
  D -- yes --> M["🟠 Moderate"]
  D -- no --> L["🟢 Low"]
  H & M & L --> E["Evidence stored with rule version rules-v1"]
  E -. "optional" .-> AI["AI explains the evidence<br/>(validated JSON, no invented numbers,<br/>falls back safely)"]
  E --> T["Human approves → mentor task"]
```

75 % is the line from the client brief; 65 % and 40 % are my documented choices (assumption **A2** in the design document).

### The data model, in one glance

```mermaid
erDiagram
  CAMPUS ||--o{ PROGRAMME : has
  PROGRAMME ||--o{ BATCH : "year + section"
  BATCH ||--o{ STUDENT : enrols
  BATCH ||--o{ ATTENDANCE_SESSION : "class, subject, date, period"
  ATTENDANCE_SESSION ||--o{ ATTENDANCE_RECORD : "one per student"
  FACULTY ||--o{ ASSIGNMENT : teaches
  ASSIGNMENT }o--|| SUBJECT : of
  ASSIGNMENT }o--|| BATCH : in
  ASSESSMENT_COMPONENT ||--o{ MARK : scores
  ASSESSMENT_COMPONENT ||--o{ MARKS_AUDIT : "every change"
  STUDENT ||--|| FEE_ACCOUNT : owes
  FEE_ACCOUNT ||--o{ FEE_PAYMENT : "simulated"
  STUDENT ||--o{ RISK_ASSESSMENT : "rules-v1"
  RISK_ASSESSMENT ||--o{ MENTOR_TASK : "after approval"
```
21 tables in all; the unique `idempotency_key` and unique `(class, subject, date, period)` on attendance sessions are what make replays harmless.

## 🗺 Project map

```text
campusos/
├── frontend/                  Next.js 16 · TypeScript · Tailwind
│   ├── app/                   routes (login + the signed-in shell)
│   ├── features/              one folder per module
│   │   ├── attendance/        mark, save, correct
│   │   ├── offline/           sync provider + the sync chip
│   │   ├── marks/  fees/  insights/  audit/  academic/  students/  auth/
│   ├── lib/offline/           Dexie DB, outbox, sync runner, cache  ← the hard part
│   ├── lib/api/               typed client + route-contract test
│   └── e2e/                   Playwright (real browser) tests
├── backend/                   FastAPI · SQLAlchemy 2 · Alembic
│   ├── app/api/v1/endpoints/  one router per module
│   ├── app/services/          rules engine, attendance sync, marks lifecycle, fees
│   ├── app/ai/                guarded explainer (fails closed)
│   ├── alembic/               migration 0001 (21 tables)
│   ├── tests/                 153 tests incl. the route-by-route security matrix
│   └── tools/                 local demo server (SQLite, test token issuer), API path dump
├── tools/capture-screens.cjs  how the screenshots below were taken
├── docs/                      phases 0-12, stage reports, runbook, playbook, screenshots
├── deployment.md              ← start here to run or deploy it
├── render.yaml                Render blueprint for the API
└── CampusOS_Technical_Design_Document.pdf
```

## ▶ Run it

Full step-by-step (with Supabase, Render and Vercel) is in **[`deployment.md`](deployment.md)**. The quick local check, no accounts needed:

```bash
# API
cd backend && python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt     # macOS/Linux: .venv/bin/python
.venv\Scripts\python -m pytest -q                           # expect all green
.venv\Scripts\python -m uvicorn app.main:app --port 8000

# Web (second terminal)
cd frontend && npm install && npm test && npm run dev        # http://localhost:3000
```

Without Supabase the sign-in page says, honestly, that sign-in isn't configured. To see every screen locally without a Supabase project, use the **local demo mode** in [`docs/screenshots/README.md`](docs/screenshots/README.md) (real backend, real data, locally issued test tokens).

## ✅ Proof, not promises

| What | Result |
|---|---|
| Backend tests (SQLite) | **153 passed**, including every API route rejecting anonymous callers and faculty/admin separation |
| Frontend tests | **129 passed**, including an *API contract* test that every URL the UI calls exists on the real backend |
| Real-browser tests | **12 passed**, plus a scripted run of the offline flow with real IndexedDB against the real API ([log](docs/screenshots/capture-log.txt)) |
| Typecheck · lint · production build | clean |
| Dependency audit | `npm audit` and `pip-audit`: 0 known vulnerabilities |
| Secrets in Git | none (pattern scan clean; `.env*` ignored) |

## 🪞 Honest limits

- ❌ **Not deployed.** No live URL yet, and no hosted demo logins: those need a Supabase project ([`deployment.md`](deployment.md) says exactly how).
- ❌ **Not run against PostgreSQL / real Supabase Auth.** Tests use SQLite and locally signed tokens.
- ❌ **No live AI call.** The adapter is built and tested with mocked HTTP; without `AI_PROVIDER_API_KEY` the screens show the rule evidence and say AI text is unavailable.
- ⚠️ **No Service Worker.** The data survives a reload, but the page itself needs the app to be reachable to load; pending attendance syncs next time the app is opened online.
- ⚠️ **Not built** (optional depth in the brief): admissions, staff leave, multi-campus dashboards, university/NAAC/Tally exports, Odia messages, the plain-English query assistant, rate limiting, CSP.

Full list with severities: [`docs/stage-10/BUG_REGISTER.md`](docs/stage-10/BUG_REGISTER.md).

## 📚 Docs worth opening

| Read this | For |
|---|---|
| [`CampusOS_Technical_Design_Document.pdf`](CampusOS_Technical_Design_Document.pdf) | the full design, assumptions A1-A14, screenshots explained |
| [`deployment.md`](deployment.md) | run / deploy, env variable names, troubleshooting |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) | operating it; step-by-step scenarios, the 10-minute demo script |
| [`docs/screenshots/README.md`](docs/screenshots/README.md) | every image explained |
| [`docs/stage-8/OFFLINE_ATTENDANCE_REPORT.md`](docs/stage-8/OFFLINE_ATTENDANCE_REPORT.md) | the offline design and its evidence |
| [`docs/stage-10/`](docs/stage-10) | QA, security, accessibility, responsive, database reports |

<div align="center">

<sub>Built for the Isocode Labs take-home · client brief: a three-campus trust in Bhubaneswar · prototype scope: one campus, B.Tech CSE · synthetic data only 🐈‍⬛</sub>

</div>

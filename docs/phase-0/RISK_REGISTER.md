# CampusOS — Phase 0: Risk register

Likelihood × impact are qualitative (H/M/L). Owners are the intern team (us) unless noted.

---

## 1. Delivery and scope

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-01 | Two architecture stories in the repo (Next-only vs FastAPI) confuse implementation | H | H | Phase 0 folder is source of stack truth until Phase 2 rewrites `docs/ARCHITECTURE.md`. Do not code from `CLAUDE.md` stack line until updated. |
| R-02 | Building a “full ERP” instead of CSE MVP | M | H | Enforce in/out list. No Management/Pharmacy data. No admissions. |
| R-03 | Calendar (~5–9 Nov 2026) vs 12-phase plan | H | H | Phase 8 (offline) is non-negotiable. Cut Insights polish, extra Stitch, extra charts first. |
| R-04 | Stitch / UI time crowds out sync tests | M | H | Design system already exists. Stitch is reference. Tests before extra Miso frames. |

---

## 2. Offline attendance (highest product risk)

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-05 | Duplicate sessions on retry | M | H | UUID idempotency + unique natural key; Pytest replay |
| R-06 | Local records discarded on 401/500 | M | H | Outbox never deleted except on confirmed ACK of *this* payload |
| R-07 | Roster never cached, so “offline” is fake | M | H | Cache roster with session; Playwright offline after first load |
| R-08 | Conflict from two tabs/devices | M | M | 409 visible; no silent merge (Q-07) |
| R-09 | Decorative Online/Offline chip | M | H | Bind to `navigator.onLine` + outbox length + last error only |

---

## 3. Security and data

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-10 | Faculty APIs trusted because the menu is hidden | H | H | FastAPI dependencies on every write; Pytest 403 cases |
| R-11 | Next.js talking to Postgres with a powerful key | M | H | Browser talks to FastAPI only. DB URL server-side. |
| R-12 | Secrets in Git or screenshots | L | H | `.env` gitignore; `.env.example` empty; pre-commit reminder |
| R-13 | Real student PII in seed | L | H | Synthetic names except specified sample |
| R-14 | Claiming DPDP compliance | M | M | Explicit non-claim in README and TDD |
| R-15 | AI prompt exfiltrates extra PII or invents history | M | H | Minimal payload; Pydantic parse; rules overwrite category |

---

## 4. Platform and operations

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-16 | Render cold start makes demo look “down” | M | M | Health check, warmup note in demo script; move host if needed |
| R-17 | CORS / cookie issues between Vercel and Render | H | M | Explicit origins; SameSite; document local HTTPS vs HTTP |
| R-18 | Schema drift (Alembic vs leftover Supabase SQL) | M | M | One migration path: Alembic. Treat old DATABASE_DESIGN as spec. |
| R-19 | Timezone bugs (UTC vs Asia/Kolkata attendance date) | M | M | Store `held_on` as date in IST; tests around midnight |
| R-20 | Frontend ships with `localhost` API URL | L | M | Env in Vercel; fail build if missing |

---

## 5. Product honesty and AI

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-21 | Dashboard shows 7,800 students / ₹2.4L as if live trust KPIs | H | M | Bind Overview to seed queries; caption prototype campus |
| R-22 | Fake AI text hardcoded as “model output” | M | H | If no key: show “Explanation unavailable”; still show rule category |
| R-23 | Mentor tasks auto-created without Admin intent | L | M | Tasks only via Admin POST |
| R-24 | Mock payments look real | M | M | Permanent “Simulated” / “demo mode” on UI and receipts |

---

## 6. UX / responsive

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-25 | Desktop tables overflow at 360px | H | M | `RESPONSIVE_CONTRACT.md`; Playwright overflow assert |
| R-26 | Attendance not one-handed / >30s | M | H | Template without metric cards; 44px controls; sticky save |
| R-27 | Miso on fee/marks grids | L | L | Design-system placement rules |

---

## 7. Residual

Even with mitigations, **R-05/R-06/R-10** can fail the assignment if skipped. They are the Phase 8 and Phase 10 exit criteria.

**Risk appetite:** Prefer a smaller, real FastAPI surface over a wide UI with stubbed routes.

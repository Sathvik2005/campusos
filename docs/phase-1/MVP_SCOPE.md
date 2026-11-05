# CampusOS — Phase 1: MVP scope

**MVP thesis:** Prove one connected academic operations workspace for **one campus** and **B.Tech CSE**, with **offline-first attendance** as the signature capability.

CampusOS *may later* serve three campuses and the full student lifecycle. Those are **expansion opportunities**, not half-built MVP screens.

---

## 1. In scope

| Area | What “done” means |
| --- | --- |
| Tenancy | Single seeded campus; no campus switcher |
| Programme | B.Tech Computer Science and Engineering only |
| Roles | Faculty, Office Admin |
| Auth | Sign in / out, session, server-side RBAC |
| Academic masters | Campus (read), programme, academic year, batch, subjects, faculty records, faculty–subject–batch assignments |
| Students | Directory, search, filters, profile (identity, attendance %, internals, dues for Admin) |
| Attendance | Mobile-first marking, Present/Absent/Late, mark-all, completion, shortage flag on profile |
| Offline sync | IndexedDB outbox, retry, idempotency, visible pending/failed/conflict, never silent discard |
| Marks | IA components, validation, draft → submitted → moderated → locked, Admin unlock |
| Fees | Total / paid / outstanding, mock payment, simulated receipt, payment history |
| Insights | Deterministic risk, evidence, optional AI explanation, mentor tasks |
| Audit | Marks, Admin attendance corrections, payments, risk/task, lifecycle |
| Overview | Role-appropriate dashboard bound to prototype data |
| Quality | Responsive 1440–360, loading/empty/error/success, no dead buttons |
| Data | Synthetic CSE cohort + exact Subhashree record |
| Delivery | Tests for P0, live deploy, TDD, demo credentials, GitHub, ZIP |

---

## 2. Out of scope (do not stub as fake modules)

| Area | Future expansion |
| --- | --- |
| Timetable generation / clash detection | After masters are stable |
| Payroll, HR, leave | Separate workforce product slice |
| Hostel, transport, library | Campus services ERP |
| Full admissions lifecycle | CRM + documents + counselling |
| Real payment gateway / UPI / bank file | After mock ledger is trusted |
| SMS / WhatsApp / email blasts | Notifications platform |
| University / AICTE / NAAC integrations | Export-first, then APIs |
| Multi-campus production rollout | After CSE MVP is operational |
| Parent portal / student self-service | After identity & DPDP design |
| NLP reporting assistant | After core is complete |
| Management / Pharmacy programmes | After CSE template works |
| True DPDP compliance programme | Legal review, not a toggle |

If a navigation item would be empty theatre, **it must not appear**.

---

## 3. MoSCoW

| Must (P0) | Should (P1) | Could (P2) |
| --- | --- | --- |
| Auth + RBAC | Admin student create/edit | Extra empty-state Miso poses |
| Seeded masters + assignments | Attendance Admin correction with reason | Activity feed richness |
| Student directory + profile | Faculty backfill date picker | Charts on Insights |
| Online attendance <30s | Paginated directory | Protected OpenAPI in prod |
| Offline persist + idempotent sync + failure UI | Unlock locked marks | Nightly risk job |
| Marks draft/submit/moderate/lock + audit | Receipt print/share | Faculty Insights **read** of own at-risk students |
| Fee ledger + mock pay + receipt | Dashboard attention list | — |
| Deterministic risk + fallback | AI explanation when key present | — |
| Mentor task create | Responsive QA screenshots | — |
| Sample student exact | — | — |

**Cut order if the deadline slips:** P2 → AI explanation (keep rules) → Admin student CRUD → visual polish. **Never cut:** offline sync correctness, RBAC, marks lock, simulated fee integrity.

---

## 4. Feasibility vs assignment window

Target submission ~5 Nov 2026, official ~9 Nov 2026. A disciplined 3-day build can ship P0 if Phase 8 (offline) is protected. This MVP is **feasible** if the team does not implement out-of-scope ERP chapters.

---

## 5. Honest claims allowed in README / TDD

- “Prototype for one CSE cohort with demo accounts.”  
- “Payments are simulated.”  
- “Risk flags follow fixed thresholds; language model explains evidence when available.”  
- “Designed to support same-day attendance and faster reconciliation; institutional KPIs are client targets, not measured outcomes of this prototype.”

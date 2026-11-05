# CampusOS — Implementation plan

Independently testable milestones. **Offline attendance reliability is the critical path.** If behind schedule, cut polish and secondary UI, not sync correctness.

Three-day target (not permission to skip tests):

| Day | Phases |
| --- | --- |
| 1 | 0–4 |
| 2 | 5–8 |
| 3 | 9–10 |

Phase 1 code starts only after document approval.

---

## Phase 0 — Product context (this delivery)

**Objective:** Permanent product identity and engineering contract.

**Deliverable:** `docs/*`, `CLAUDE.md`, `README.md`

**Acceptance:** Documents exist, scope/exclusions clear, approval requested. No application code required.

**Status:** Complete pending human approval.

---

## Phase 1 — Design system in code + screen inventory

**Objective:** Tokens, fonts, shell, and static template scaffolding that match the design system. Not wired to real data yet **except** that no control is a dead end — placeholder screens must route.

**Features**

- Tailwind theme (Paper, Midnight, Lilac, Mint)
- Manrope + Inter
- AppShell desktop/tablet/mobile per responsive contract
- Seven templates as empty-but-honest pages
- Miso SVG placeholders for login/empty/offline

**Likely files**

- `app/layout.tsx`, `app/globals.css`
- `components/shell/*`
- `components/ui/*` (shadcn)
- `public/miso/*`

**Dependencies:** Phase 0 approval.

**Tests:** Playwright viewport smoke: 1440, 768, 390, 360 — no `scrollWidth > clientWidth` on shell pages.

**Done when:** Shell matches templates; QA checklist started; still no fake metrics presented as client KPIs.

---

## Phase 2 — Application foundation

**Objective:** Next.js + Supabase client, env pattern, logging, error boundary, feature flags.

**Features**

- Supabase browser/server clients
- Zod env schema
- Query provider if needed (keep light)
- Health/error UI

**Files:** `lib/supabase/*`, `lib/env.ts`, `middleware.ts` stub

**Tests:** Unit test env schema; app boots locally.

**Done when:** App runs with missing env showing a setup screen, not a crash loop.

---

## Phase 3 — Authentication + academic masters

**Objective:** Real sign-in, roles, seeded masters Admin can edit.

**Features:** FR-01, FR-02

**Files:** `app/login`, `app/academics`, migrations, RLS, seed

**Dependencies:** Phase 2

**Tests**

- Unauthenticated redirect
- Faculty forbidden on masters write
- Admin create/update subject/assignment validation

**Done when:** Two demo users exist; Faculty cannot patch `programmes` via API.

---

## Phase 4 — Students + seed data

**Objective:** Directory + detail with computed attendance/marks/fees from seed.

**Features:** FR-03 + sample student exactness

**Files:** `app/students`, `student_directory_view`, seed SQL

**Tests:** Search roll `ENG-24-CSE-0412` returns Subhashree with 81.5%, 33/40, ₹0.

**Done when:** Fictional cohort seeded; pagination works; mobile cards work.

---

## Phase 5 — Offline attendance + sync (CRITICAL)

**Objective:** Flagship. Under 30s marking. Durable local queue. Idempotent sync.

**Features:** FR-04

**Files:** `lib/offline/*`, `app/attendance/*`, `attendance_sessions` migrations, sync action

**Dependencies:** Phases 3–4

**Tests (non-negotiable)**

- Mark while `offline` (Playwright offline)
- Kill browser / reload, pending remains
- Go online, one session on server
- Replay same idempotency key → still one session
- Failed sync keeps IndexedDB rows
- Faculty cannot write another faculty’s batch

**Done when:** Status chip reflects real queue; no decorative offline UI.

**If this phase slips:** freeze Insights polish, extra empty-state art, and any assistant feature.

---

## Phase 6 — Marks + moderation

**Objective:** FR-05 with audit and lock.

**Files:** `app/marks/*`, triggers, audit table

**Tests:** max validation; faculty blocked when locked; audit row on admin edit.

**Done when:** Lifecycle draft → submitted → locked is visible and enforced.

---

## Phase 7 — Fees + mock payments

**Objective:** FR-06

**Files:** `app/fees/*`, payments + receipts

**Tests:** outstanding math; duplicate idempotency; amount > outstanding rejected; UI says simulated.

**Done when:** Receipt route renders demo receipt.

---

## Phase 8 — Risk intelligence

**Objective:** FR-07

**Files:** `lib/domain/risk.ts`, `app/insights/*`, explanation route

**Tests:** thresholds beat model; missing data disclosed; invalid JSON dropped; provider down → fallback; mentor task insert is admin-only.

**Done when:** AI cannot write academic tables (proven by policy test).

---

## Phase 9 — Testing + security (CRITICAL)

**Objective:** Close holes. Prove claims.

**Work**

- RLS matrix test
- Playwright journeys for both personas
- Responsive screenshot set
- Secret scan
- Dead button audit
- Accessibility pass on attendance + login

**Done when:** Checklist in `docs/RESPONSIVE_CONTRACT.md` is evidence-backed, not aspirational.

---

## Phase 10 — Deployment + TDD + ZIP (CRITICAL)

**Objective:** Vercel preview, seed, demo accounts, assignment package.

**Work**

- Production env on Vercel / Supabase
- README runbook
- Technical Design Document as required by the intern brief
- ZIP excluding `.env`, `node_modules`, secrets

**Done when:** Reviewer can log in and complete attendance offline-to-sync, lock marks, record a simulated payment.

---

## Priority if time is short

1. Auth + RLS
2. Offline attendance sync
3. Marks lock + audit
4. Fees mock + receipt
5. Students directory
6. Deterministic risk (AI explanation optional)
7. Visual polish / Miso
8. Extra charts / assistant

---

## Definition of done (product)

An engineering interviewer can use the deployed prototype as Faculty and as Admin, on a phone-sized viewport and a laptop, without encountering dead controls, fake offline, or fake AI writes.

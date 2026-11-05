# CampusOS — Phase 0: Phased implementation plan

Roadmap **0 → 12**. Each phase has an exit criterion. **Do not start a phase until the previous exit is met**, unless the user explicitly fast-forwards.

Existing `docs/IMPLEMENTATION_PLAN.md` described a Next-only sequence. **This document is the plan for the FastAPI split.** Do not execute both.

---

## Phase 0 — Context building (this delivery)

**Exit:** Context pack in `docs/phase-0/` reviewed. Stack and MVP in/out agreed.

**No code.**

---

## Phase 1 — Product definition

**Objective:** Tighten PRD into implementable stories.

**Work:** User stories with acceptance criteria; MVP priority (MoSCoW); map stories to API resources; confirm sample student and thresholds.

**Artifacts:** `docs/phase-1/PRD.md` (or an additive `USER_STORIES.md` that points at existing `docs/PRD.md` without silently contradicting it).

**Exit:** Prioritised backlog. Offline attendance = Must. AI explanation = Should. Extra charts = Could.

**Still no application code** unless you approve combining 1–4.

---

## Phase 2 — Technical architecture

**Objective:** Replace the outdated Next-only architecture docs.

**Work:** C4-style overview; sequence diagrams (login, offline sync, lock marks, mock pay, risk); OpenAPI resource list; schema aligned to FastAPI; auth sequence; decision record: “FastAPI is the only writer”.

**Artifacts:** New `docs/ARCHITECTURE.md` **after approval to overwrite**; `docs/API_CONTRACT.md`; update `docs/DATABASE_DESIGN.md` RLS section to “API role + constraints”.

**Exit:** Approved diagrams + endpoint list. Hosting: Vercel + Render + Supabase Postgres.

---

## Phase 3 — UI/UX design

**Objective:** Visual identity locked for implementation.

**Work:** Use existing `DESIGN_SYSTEM.md` + `RESPONSIVE_CONTRACT.md`. Optional Stitch: Overview + Attendance mobile first (`docs/STITCH_PROMPTS.md` section 4). Screen-by-screen notes. No new random palette.

**Exit:** Template list signed off (seven modules). Stitch is reference, not source of truth.

---

## Phase 4 — Development environment

**Objective:** Empty but runnable skeleton.

**Work:** GitHub repo; monorepo `apps/web` + `apps/api`; Python venv / uv or poetry; Node; env examples; `docker-compose` optional for local Postgres **or** local Supabase; README “how to run two processes”; CI stub.

**Exit:** `uvicorn` health + Next dev page. No features yet.

---

## Phase 5 — Backend development

**Objective:** Auth, permissions, models, migrations, core services **without** requiring a polished UI.

**Work:** Users/roles; JWT; masters; students; attendance write/sync; marks lifecycle; fees; risk rules; audit; Pydantic; Pytest for RBAC and idempotency.

**Exit:** OpenAPI works locally. Faculty 403 tests green. Seed includes Subhashree.

---

## Phase 6 — Frontend development

**Objective:** Shell, design tokens, API client, login, routing, responsive chrome.

**Work:** Next.js + Tailwind + shadcn; Manrope/Inter; AppShell per responsive contract; auth cookies; loading/empty/error primitives; Miso assets for empty/login.

**Exit:** Login + empty authenticated shell at 1440 and 390. Real session against FastAPI.

---

## Phase 7 — Core ERP modules

**Objective:** Online-happy-path for directory, masters, attendance, marks, fees.

**Work:** Wire screens to APIs. Distinct templates. Working forms. No dead buttons.

**Exit:** Admin and Faculty can complete online journeys. Attendance still needs Phase 8 for offline.

---

## Phase 8 — Offline attendance (critical)

**Objective:** Dexie queue, retries, duplicates, visible failures.

**Work:** Roster cache; outbox; sync runner; Playwright offline; conflict 409 UI.

**Exit:** Criteria in BUSINESS_REQUIREMENTS BR-05. If late, freeze Phase 9 visual extras.

---

## Phase 9 — AI student insights

**Objective:** Rules + optional explanation + mentor tasks.

**Work:** Deterministic engine first; FastAPI AI adapter; Insights UI; fail safe.

**Exit:** Unplugging `AI_API_KEY` still shows flags. AI cannot POST marks/fees.

---

## Phase 10 — Testing and security

**Objective:** Prove claims.

**Work:** Pytest matrix; Vitest queue; Playwright roles; audit log checks; responsive QA checklist; secret scan.

**Exit:** Evidence, not slogans.

---

## Phase 11 — Deployment

**Objective:** Live system.

**Work:** Supabase Postgres; Render API + migrate + seed; Vercel web; CORS; demo users; smoke test offline? (limited on hosted HTTPS — document what was verified locally vs live).

**Exit:** Public URLs. Health green. Demo login works.

---

## Phase 12 — Submission

**Objective:** Evaluator pack.

**Work:** Technical Design Document; deploy instructions; demo credentials; GitHub history with real increments; ZIP without `node_modules`, `.venv`, `.env`.

**Exit:** Hand-in complete.

---

## Suggested calendar (target, not a skip-tests pass)

Given a ~3-day build window from earlier planning:

| Day | Phases | Must survive cuts |
| --- | --- | --- |
| 1 | 1–6 (thin) | Env + auth + schema + shell |
| 2 | 7–9 | Online modules + **offline sync** |
| 3 | 10–12 | Tests, deploy, TDD, ZIP |

If the window is longer, do not merge phases in a way that skips Pytest on sync.

---

## Priority order (always)

1. AuthZ on FastAPI  
2. Offline attendance correctness  
3. Marks lock + audit  
4. Fees mock + receipt  
5. Student directory + exact sample row  
6. Deterministic risk  
7. AI explanation  
8. Visual polish / Miso  

---

## Approval gates

| Before | Need approval of |
| --- | --- |
| Phase 1 | This Phase 0 pack (MVP + stack) |
| Phase 2 overwrite of old architecture docs | Explicit “update ARCHITECTURE.md” |
| Phase 4 repo/scaffold | “Start the development environment” |
| Any production secrets | User-provided keys only |

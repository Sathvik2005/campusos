# CampusOS — Phase 1 PRD

**Status:** Implementation-ready product definition  
**Stack for build:** Next.js (`frontend/`) + FastAPI (`backend/`) + Supabase PostgreSQL + Supabase Auth  
**Source documents:** `docs/phase-0/*`, this folder, `docs/DESIGN_SYSTEM.md`, `docs/RESPONSIVE_CONTRACT.md`

Sibling files: `USER_PERSONAS.md`, `USER_JOURNEYS.md`, `USER_STORIES.md`, `ACCEPTANCE_CRITERIA.md`, `MVP_SCOPE.md`, `PRODUCT_DECISIONS.md`, `REQUIREMENTS_TRACEABILITY.md`

---

## 1. Overview

CampusOS is an offline-first academic operations workspace. Tagline: **Campus life, in sync.**

The client is an educational trust in Bhubaneswar (Engineering, Management, Pharmacy; 7,800 students). The **MVP** is one Engineering campus, **B.Tech CSE**, roles **Faculty** and **Office Admin**.

**Promise:** Campus operations continue even when the internet doesn't.

---

## 2. Objectives

**Problem:** Fragmented Excel, paper attendance, desktop records, slow fee reconciliation, no reliable offline classroom workflow.

**MVP objectives**

1. One student/academic record for CSE Year 2.  
2. Faculty mark attendance on mobile in under 30 seconds once the roster is loaded.  
3. Attendance works offline after roster cache; sync is idempotent.  
4. Internals: draft → submit → moderate → lock, with audit.  
5. Admin sees dues, records **simulated** payments, opens receipts.  
6. Deterministic risk flags; optional AI explanation; human mentor tasks.  
7. Server-side permissions. Synthetic data only (plus Subhashree Mohanty sample).

**Client targets (do not claim achieved):** 95% same-day attendance; no retyping internals for uploads; fee reconciliation 10 days → 1.

---

## 3. Modules

| ID | Module | Primary users |
| --- | --- | --- |
| A | Auth + RBAC | Both |
| B | Dashboard | Both (role-specific) |
| C | Academic masters | Admin write; Faculty read assigned |
| D | Students | Admin; Faculty roster without fees |
| E | Attendance (online) | Faculty; Admin review/correct |
| F | Offline sync | Faculty |
| G | Marks + moderation | Faculty draft/submit; Admin lock |
| H | Fees + mock pay | Admin only |
| I | Risk insights + mentor tasks | Admin |
| J | Audit | Admin |

Behaviour, states, and rules: `USER_JOURNEYS.md` + `PRODUCT_DECISIONS.md`.

---

## 4. Data entities (logical — schema in Phase 2)

Users, roles, campus, programme, academic year, batch, subject, faculty assignment, student, attendance session, attendance record, assessment component, marks, fee plan, fee account, payment, receipt, risk assessment, mentor task, audit event.

---

## 5. NFRs (testable)

- Viewports: 1440, 1280, 1024, 768, 390, 360; no page overflow; ~44px targets.  
- Attendance persist in IndexedDB across refresh.  
- FastAPI enforces every write.  
- No secrets in Git. No DPDP-compliance claim. No real payments.

---

## 6. Build order after this PRD

Phase 4 scaffold → Phase 5 backend → Phase 6 frontend shell → Phase 7 modules (Dashboard, Students, Attendance first) → Phase 8 offline engine → Phase 9 AI → Phase 10 QA → Phase 11 deploy → Phase 12 submission.

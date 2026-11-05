# CampusOS — Phase 0: Project context

**Status:** Context building only. No implementation.  
**Date:** 2 November 2026  
**Engagement:** Isocode Labs — Software Engineering Intern take-home  
**Client (brief):** Educational trust / “Company A”, Bhubaneswar, Odisha

This document is the shared understanding of *who we are building for* and *what problem we are solving*. Product rules live in `BUSINESS_REQUIREMENTS.md`. Engineering defaults live in `TECHNICAL_ASSUMPTIONS.md`.

---

## 1. Repository inspection (as of this Phase 0)

The workspace `enterprise attendence for buvanshwar` is **not an application yet**.

| Finding | Detail |
| --- | --- |
| Application code | None (`package.json`, `pyproject.toml`, `app/` do not exist) |
| Git history | Not established in this workspace as a coded product |
| Existing docs | Root `docs/*.md`, `CLAUDE.md`, `README.md` from an earlier Phase 0 |
| Earlier stack proposal | Next.js App Router + **Supabase Auth + RLS as the backend** + Vercel only |
| This Phase 0 | **Supersedes that stack for future work** without deleting those files |

Existing documents remain historical product/design assets (PRD, design system, responsive contract, original schema ideas). They must **not** be treated as permission to build a Next-only backend. The approved engineering direction for Phases 2+ is:

**Next.js frontend → FastAPI backend → PostgreSQL (Supabase-hosted) → Vercel + Render.**

A later phase should reconcile `docs/ARCHITECTURE.md` and `CLAUDE.md` with this folder so implementers do not follow two stacks.

---

## 2. Project identity

| | |
| --- | --- |
| **Name** | CampusOS |
| **Tagline** | Campus life, in sync. |
| **Promise** | Campus operations continue, even when the internet doesn't. |
| **Category** | Academic operations / college ERP (MVP slice) |
| **Feel** | Modern SaaS: minimal, premium, intelligent, youthful, professional — not a generic ERP template |
| **Mascot** | Miso — subtle black campus cat. Login, empty, onboard, offline, friendly success only |

CampusOS is *positioned* as a platform that can grow to multiple campuses and the full student lifecycle. The **MVP is deliberately smaller** (one campus, one programme). Marketing language must not imply the three-campus ERP already exists.

---

## 3. Client context

An educational trust in Bhubaneswar operates three campuses:

- Engineering
- Management
- Pharmacy

**Scale (client, not MVP seed):**

- 7,800 students
- 520 teaching staff
- 340 non-teaching staff
- ₹95–110 crore annual fee revenue

**Current operations:** spreadsheets, paper registers, a legacy desktop student-records app, manual fee reconciliation, manually compiled institutional reports.

**Stated ambition:** a unified system that follows students from admission through graduation.

**MVP interpretation:** prove a trustworthy operations workspace on **one Engineering programme (B.Tech CSE)** so faculty and office staff can run the daily academic/fee loop — including classrooms with bad Wi-Fi — without claiming admissions-to-graduation coverage.

---

## 4. Business problem

Fragmented tools create:

1. Duplicate student records  
2. Delayed attendance (paper → later typing)  
3. Manual marks consolidation  
4. Poor visibility of fee dues  
5. Slow administrative reporting  
6. Weak identification of students who need academic intervention  
7. Work that **stops** when connectivity is unreliable  

The platform must reduce administrative effort and improve visibility for **faculty and office administrators**. The brief also mentions students as eventual beneficiaries; **student login is not in the MVP role list**.

---

## 5. Users (MVP)

### Faculty

Needs assigned class roster, fast mobile attendance (including offline), internal marks entry, and a clear view of draft / submitted / locked state. Must not see or edit campus-wide fees, masters, or other faculty’s classes.

### Office Admin

Needs accurate masters, student directory, attendance oversight, marks moderation and lock, fee dues and mock receipts, risk flags, and mentor follow-up tasks.

### Out of MVP (mentioned in the trust story, not built)

Students, parents, multi-campus registrars, payroll/HR, admissions officers.

---

## 6. Project goals (what “done” means for this assignment)

1. A reviewer can sign in as Faculty and as Office Admin.  
2. Faculty can mark a loaded class in under ~30 seconds on a phone-sized viewport.  
3. Attendance recorded offline survives refresh/restart and syncs **once** when online.  
4. Marks can be entered, validated, submitted, moderated, locked, and audited.  
5. Fees show total / paid / outstanding; a **simulated** payment produces a receipt.  
6. Risk flags come from **fixed rules**; AI only explains; rules still work if the model is down.  
7. UI is responsive at 1440 / 1280 / 1024 / 768 / 390 / 360 without page-level horizontal overflow.  
8. Secrets stay out of Git. Permissions are enforced on the **Python API**, not only in React.  
9. Submission includes TDD, demo credentials, live URLs, GitHub history, ZIP.

Client institutional KPIs (95% same-day attendance, fee reconciliation from ten days to one) are **goals the prototype supports**, not outcomes we claim already happened.

---

## 7. Constraints

- Synthetic data only, plus the named sample student.  
- One campus, B.Tech CSE, second-year-oriented seed (see assumptions).  
- No real payment gateway, SMS, WhatsApp, or university integrations.  
- Do not claim DPDP Act 2023 compliance.  
- Do not invent finished features.  
- Technical correctness of sync, auth, and locks outranks visual decoration.  
- Target submission around 5 November 2026; official deadline 9 November 2026 (from earlier brief). Treat calendar as tight.

---

## 8. How this folder relates to earlier docs

Keep and reuse:

- `docs/PRD.md` — product rules still largely valid; stack section is outdated  
- `docs/DESIGN_SYSTEM.md` + `docs/RESPONSIVE_CONTRACT.md` — still the UI contract  
- `docs/DATABASE_DESIGN.md` — relational model still a strong starting point; **RLS-as-only-gate is no longer the architecture** (FastAPI is the gate; DB constraints remain)  
- `docs/STITCH_PROMPTS.md` — Phase 3 visual exploration  

Do not execute:

- `docs/IMPLEMENTATION_PLAN.md` phases that assume Next.js Server Actions as the backend  
- `CLAUDE.md` stack line “Supabase Auth + RLS, no Python”

---

## 9. Phase 0 exit

This folder is complete when the user approves:

1. MVP in/out list  
2. FastAPI + Next.js + Supabase Postgres + Vercel/Render split  
3. Clarifications in `TECHNICAL_ASSUMPTIONS.md` (or explicitly accepts defaults)  
4. Permission to start **Phase 1 product definition** (user stories / AC refinement) — still not application code unless they jump the sequence

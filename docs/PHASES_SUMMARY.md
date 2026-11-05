# CampusOS — All phases at a glance

This document consolidates the product, engineering, and release roadmap for CampusOS. It is intended as the working plan for implementation and validation from product foundation through submission-ready delivery.

## Phase 0 — Product context and engineering contract

**Goal:** Establish product identity, boundaries, architecture intent, and delivery rules.

**Primary outputs:**
- Product narrative and brand direction
- PRD and scope definition
- Design system and responsive contract
- Architecture, database design, and implementation plan
- Local engineering rules (`CLAUDE.md`)

**Status:** Complete as documentation, pending human approval to start implementation.

---

## Phase 1 — Design system in code + screen inventory

**Goal:** Build the shell, tokens, and static screens that match the CampusOS product language.

**Core work:**
- Tailwind theme with Paper, Midnight, Lilac, and Mint
- Typography and layout system
- App shell for desktop, tablet, and mobile
- Seven template screens as honest empty states
- Miso brand placeholders for login, empty, onboarding, and offline states

**Status:** Planned after approval.

---

## Phase 2 — Application foundation

**Goal:** Set up the app runtime and environment model.

**Core work:**
- Next.js + TypeScript + Tailwind foundation
- Supabase client/server setup
- Environment validation with Zod
- Error boundary and feature-flag plumbing
- Local app health and bootstrap UX

**Status:** Planned.

---

## Phase 3 — Authentication + academic masters

**Goal:** Deliver secure access and admin-managed academic configuration.

**Core work:**
- Login and protected routes
- Faculty/Admin role model
- Subject, programme, faculty, and assignment management
- RLS and server-side permission checks

**Status:** Planned.

---

## Phase 4 — Students + seed data

**Goal:** Provide the student directory and roster information for the selected programme.

**Core work:**
- Student directory search and filters
- Student detail views
- Computed academic and fee status
- Required sample record: Subhashree Mohanty

**Status:** Planned.

---

## Phase 5 — Offline attendance + sync (critical path)

**Goal:** Deliver the flagship experience: attendance works without internet and syncs safely when connectivity returns.

**Core work:**
- IndexedDB-first local write model
- Outbox queue and retry logic
- Idempotent server sync
- Duplicate prevention and server-side uniqueness checks
- Faculty scoping by assignment
- Real offline status tied to navigator + Dexie state

**Status:** Planned; non-negotiable priority in engineering.

---

## Phase 6 — Marks + moderation

**Goal:** Support internal assessment management with safe auditability and locking.

**Core work:**
- Marks entry for faculty
- Submission and moderation flow
- Locking rules
- Audit history and validation

**Status:** Planned.

---

## Phase 7 — Fees + mock payments

**Goal:** Manage dues and demonstrate payment workflows without fake claims.

**Core work:**
- Outstanding fee logic
- Mock payment transactions
- Receipt generation
- Admin visibility into payment state

**Status:** Planned.

---

## Phase 8 — Risk intelligence

**Goal:** Provide explainable academic-risk insights without letting AI write protected records.

**Core work:**
- Risk rules and thresholds
- Explanation logic tied to visible evidence
- Mentor task generation for admins only
- Fallback behavior when the model or provider fails

**Status:** Planned.

---

## Phase 9 — Testing + security (critical)

**Goal:** Close the quality and security gaps before release.

**Core work:**
- RLS validation and access-boundary tests
- Responsive viewport tests
- Functional Playwright flows for faculty and admin
- Secret scanning and dead-button review
- Accessibility and keyboard checks
- Data integrity and security validation

**Status:** Planned; must be evidence-backed, not aspirational.

---

## Phase 10 — Deployment + TDD + delivery bundle

**Goal:** Prepare the app for review and demo deployment.

**Core work:**
- Vercel or equivalent deployment setup
- Production environment configuration
- README runbook
- Demo account setup and seeding
- ZIP package for assignment submission excluding secrets and build artifacts

**Status:** Planned; final engineering release gate.

---

## Phase 11 — Comprehensive QA, security, performance, and accessibility audit

**Goal:** Execute a real pre-production quality gate across the complete application.

**Core work:**
- Functional, backend, database, auth, and authorization QA
- Offline sync and conflict testing
- Performance and accessibility validation
- Security review for secrets, access control, and privacy
- Regression verification for previously fixed issues

**Status:** Planned, based on the pre-production audit prompt included in the attached CampusOS material.

---

## Phase 12 — Final sign-off and submission readiness

**Goal:** Move from working implementation to a polished, documented, reliable product submission.

**Core work:**
- Final bug-fix pass
- Feature validation against acceptance criteria
- Deployment verification and final documentation
- Submission packaging and known-limitations reporting
- Human review and sign-off

**Status:** Planned as the final handoff phase.

---

## Delivery priority order

If schedule pressure appears, the project should protect the following in order:

1. Authentication and RLS
2. Offline attendance and sync reliability
3. Marks lock and audit logic
4. Fees and mock-payment flows
5. Student directory and sample data
6. Risk explanation and mentor tasks
7. Visual polish and brand detail
8. Extra charts or assistant-style features

This ordering keeps the core academic operations promise intact without sacrificing the product's reliability story.

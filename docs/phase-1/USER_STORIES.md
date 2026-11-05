# CampusOS — Phase 1: User stories

Format: *As a [role], I want [capability], so that [benefit].*

Priority: **P0** Must for MVP demo · **P1** Should · **P2** Could.  
Security/validation notes are binding. Full Given/When/Then lives in `ACCEPTANCE_CRITERIA.md` (same IDs).

---

## Authentication and access

### US-AUTH-01 · P0 · Module A
As a Faculty or Office Admin, I want to sign in with email and password, so that only authorised staff use CampusOS.  
**Deps:** none  
**AC:** AC-AUTH-01  
**Security:** hashed passwords; generic login failure; HTTPS in production.

### US-AUTH-02 · P0 · Module A
As the system, I want unauthenticated requests rejected, so that records are not public.  
**AC:** AC-AUTH-02

### US-AUTH-03 · P0 · Module A
As Faculty, I want to be blocked from Admin capabilities even if I call the API directly, so that fees and locks stay in the office.  
**AC:** AC-AUTH-03 · **Security:** FastAPI RBAC, not UI-only.

### US-AUTH-04 · P0 · Module A
As a signed-in user, I want to sign out, so that a shared machine is safe.  
**AC:** AC-AUTH-04

---

## Dashboard

### US-DASH-01 · P0 · Module B
As Office Admin, I want an overview of this prototype campus (student count, attendance today, outstanding dues, students to review, marks awaiting moderation), so that I know where to work first.  
**AC:** AC-DASH-01 · **Validation:** figures from server aggregates, not hardcoded trust KPIs.

### US-DASH-02 · P0 · Module B
As Faculty, I want an overview of my assignments, pending sync count, and marks status, so that I am not dropped into a finance dashboard.  
**AC:** AC-DASH-02

---

## Academic masters

### US-MAS-01 · P0 · Module C
As Office Admin, I want seeded CSE masters (campus, programme, year, batch, subjects, faculty, assignments) to be visible and valid, so that attendance and marks have a real graph.  
**AC:** AC-MAS-01

### US-MAS-02 · P1 · Module C
As Office Admin, I want to create and update subjects and faculty–subject–batch assignments, so that the office can correct the timetable-less assignment list.  
**Deps:** US-MAS-01  
**AC:** AC-MAS-02 · **Validation:** FK integrity; no duplicate assignment tuple.

### US-MAS-03 · P0 · Module C
As Faculty, I want to see only assigned subject–batch pairs, so that I cannot mark the wrong class.  
**AC:** AC-MAS-03

---

## Students

### US-STU-01 · P0 · Module D
As Office Admin, I want a searchable student directory (roll, name, programme, year, attendance %, internals, outstanding fees), so that I can find someone in seconds.  
**AC:** AC-STU-01

### US-STU-02 · P0 · Module D
As Office Admin, I want Subhashree Mohanty (ENG-24-CSE-0412) to appear with 81.5% / 33/40 / ₹0, so that the client sample is honoured.  
**AC:** AC-STU-02

### US-STU-03 · P0 · Module D
As Office Admin, I want a student profile with identity and academic/fee summaries, so that I do not hop across spreadsheets.  
**AC:** AC-STU-03

### US-STU-04 · P0 · Module D
As Faculty, I want roster identity (roll, name) without fee amounts, so that I can mark attendance without seeing dues.  
**AC:** AC-STU-04 · **Security:** fees omitted from Faculty APIs.

### US-STU-05 · P1 · Module D
As Office Admin, I want to create or edit a CSE student, so that the directory is not seed-only.  
**AC:** AC-STU-05 · **Validation:** unique roll; programme must be CSE.

---

## Attendance (online)

### US-ATT-01 · P0 · Module E
As Faculty, I want to mark Present, Absent, or Late for every student in an assigned period, so that the college has a same-day record.  
**Deps:** US-MAS-03, US-STU-04  
**AC:** AC-ATT-01

### US-ATT-02 · P0 · Module E
As Faculty, I want Mark all present (fill unmarked) and a save that requires a complete roster, so that a full class takes under 30 seconds.  
**AC:** AC-ATT-02

### US-ATT-03 · P0 · Module E
As Faculty, I want duplicate period submissions rejected, so that one class is not stored twice.  
**AC:** AC-ATT-03

### US-ATT-04 · P0 · Module E
As Faculty, I want synced sessions to become read-only for me, so that I do not accidentally alter office records from my phone.  
**AC:** AC-ATT-04

### US-ATT-05 · P1 · Module J
As Office Admin, I want to correct a synced session with a reason, so that genuine errors can be fixed with a trail.  
**AC:** AC-ATT-05

---

## Offline attendance

### US-OFF-01 · P0 · Module F
As Faculty, I want to mark a previously loaded roster with no internet, so that classroom Wi-Fi does not stop the class.  
**AC:** AC-OFF-01

### US-OFF-02 · P0 · Module F
As Faculty, I want pending sessions to survive refresh and browser restart, so that I do not lose a period.  
**AC:** AC-OFF-02

### US-OFF-03 · P0 · Module F
As Faculty, I want queued sessions to sync when the device is back online, so that the office receives the record once.  
**AC:** AC-OFF-03

### US-OFF-04 · P0 · Module F
As Faculty, I want retries of the same save to be idempotent, so that double-taps do not duplicate students.  
**AC:** AC-OFF-04

### US-OFF-05 · P0 · Module F
As Faculty, I want failed or conflicted sync to stay on the device and be visible, so that nothing is silently discarded.  
**AC:** AC-OFF-05

### US-OFF-06 · P0 · Module F
As Faculty, I want an honest status chip, so that Online/Offline/Pending/Failed means the real queue.  
**AC:** AC-OFF-06

---

## Marks

### US-MRK-01 · P0 · Module G
As Faculty, I want to enter component scores that cannot exceed the maximum, so that internals are valid.  
**AC:** AC-MRK-01

### US-MRK-02 · P0 · Module G
As Faculty, I want to save drafts and submit a complete component for moderation, so that the office can lock a clean sheet.  
**AC:** AC-MRK-02

### US-MRK-03 · P0 · Module G
As Office Admin, I want to moderate (with reason if scores change) and lock internals, so that Faculty cannot keep editing.  
**AC:** AC-MRK-03

### US-MRK-04 · P0 · Module G / J
As Office Admin, I want an immutable audit of score and lifecycle changes, so that disputes are traceable.  
**AC:** AC-MRK-04

### US-MRK-05 · P1 · Module G
As Office Admin, I want to unlock a component with a reason, so that a genuine error can be fixed without Faculty rewriting the sheet.  
**AC:** AC-MRK-05

---

## Fees

### US-FEE-01 · P0 · Module H
As Office Admin, I want to see total, paid, and outstanding for a student, so that reconciliation is a lookup not a spreadsheet hunt.  
**AC:** AC-FEE-01

### US-FEE-02 · P0 · Module H
As Office Admin, I want to record a simulated payment that cannot exceed outstanding or double-charge, so that the demo ledger stays consistent.  
**AC:** AC-FEE-02

### US-FEE-03 · P0 · Module H
As Office Admin, I want a simulated receipt, so that the office workflow is complete without a gateway.  
**AC:** AC-FEE-03

### US-FEE-04 · P0 · Module H
As Faculty, I want no access to fee APIs, so that financial data stays in the office.  
**AC:** AC-FEE-04

---

## Insights

### US-RISK-01 · P0 · Module I
As Office Admin, I want students classified by deterministic attendance/marks rules, so that flags are explainable without a model.  
**AC:** AC-RISK-01

### US-RISK-02 · P0 · Module I
As Office Admin, I want missing data disclosed rather than invented trends, so that I do not act on fiction.  
**AC:** AC-RISK-02

### US-RISK-03 · P1 · Module I
As Office Admin, I want an AI explanation of the **same evidence**, so that I can brief a mentor faster.  
**Deps:** US-RISK-01  
**AC:** AC-RISK-03 · **Security:** minimal PII to model; invalid output dropped.

### US-RISK-04 · P0 · Module I
As Office Admin, I want the product to keep showing rule-based flags when the AI provider fails, so that Insights is never a blank page.  
**AC:** AC-RISK-04

### US-RISK-05 · P0 · Module I
As Office Admin, I want to create a mentor follow-up task, so that a flag becomes human work not an automatic penalty.  
**AC:** AC-RISK-05

### US-RISK-06 · P0 · Module I
As the system, I want the AI never to write academic or fee records, so that a model cannot corrupt the ERP.  
**AC:** AC-RISK-06

---

## Quality

### US-NFR-01 · P0
As either role, I want primary screens usable at 1440px and 390px without horizontal page overflow, so that office PCs and classroom phones both work.  
**AC:** AC-NFR-01

### US-NFR-02 · P0
As either role, I want loading, empty, error, and success states on primary actions, so that I am never staring at a dead control.  
**AC:** AC-NFR-02

# CampusOS — Phase 0: Business requirements

MVP requirements derived from the client brief and prior PRD. Formal user-story IDs will be expanded in **Phase 1**. Nothing here authorises coding.

---

## 1. Vision vs MVP

**Vision:** a multi-campus ERP from admission through graduation for Engineering, Management and Pharmacy.

**MVP:** one campus, one programme (**B.Tech Computer Science and Engineering**), two roles (**Faculty**, **Office Admin**), daily academic operations plus mock fees plus explainable risk.

| In MVP | Out of MVP |
| --- | --- |
| Auth + RBAC | Student / parent portals |
| Academic masters | Admissions, hostel, transport, library |
| Student directory + detail | Payroll, staff leave |
| Mobile attendance | Timetable generation |
| Offline attendance + sync | Real payment gateways |
| Internal marks + moderation lock | Real SMS / WhatsApp |
| Fee dues + mock payment + receipt | Multi-campus production switcher |
| Deterministic risk + AI explanation + mentor tasks | Full NAAC / AICTE / university APIs |
| Role-appropriate dashboards | NLP campus assistant as a must-have |
| Synthetic CSE cohort | Other programmes in the active dataset |

---

## 2. Success indicators

**Client-stated (do not present as already achieved):**

- 95% of classes have attendance entered the same day  
- University mark uploads require no re-typing  
- Monthly fee reconciliation: ten days → one  

**Prototype evidence we *will* show:**

- Attendance sessions created, pending count, successful sync, duplicates rejected  
- Marks submitted and locked with audit rows  
- Simulated payments and receipts  
- Risk assessments + mentor tasks  
- Faculty cannot hit Admin APIs successfully  

---

## 3. Functional requirements

### BR-01 Authentication and roles

Users sign in. Roles: `faculty`, `office_admin`. Faculty see assigned classes only. Admin manages authorised records for the selected (seeded) campus.

**Acceptance (draft)**

- Unauthenticated requests to protected APIs return 401  
- Faculty cannot create masters, record fees, lock marks, or read unassigned rosters (403)  
- UI hiding is not the only control  

### BR-02 Academic masters

Campus, programme, academic year, batch, subject, faculty, faculty–subject–batch assignments.

**Acceptance:** Admin CRUD with validation; Faculty read only what is assigned; invalid graphs rejected.

### BR-03 Student directory

Roll, name, programme, year, attendance %, internals, outstanding fees. Search by roll or name. Filter by batch. Detail view.

**Acceptance:** `ENG-24-CSE-0412` / Subhashree Mohanty / 81.5% / 33/40 / ₹0 present exactly. Other rows fictional CSE only.

### BR-04 Attendance (online)

Assigned roster, session (date, period, subject), Present / Absent / Late, Mark all present, save, completion indicator. Shortage flag when attendance **< 75%**.

**Acceptance:** Typical loaded class markable in under 30 seconds on mobile. No extra dashboard chrome on this screen.

### BR-05 Offline attendance and sync

After roster is available, marking works without internet. Local persistence (IndexedDB). Retryable, idempotent sync. Visible pending / failed / conflict states. **Never silently discard** unsynced records.

**Acceptance:** Survive refresh and restart; reconnect syncs; duplicate POST does not duplicate sessions/records; failed sync keeps local data.

### BR-06 Internal marks

Component-wise entry, max validation, lifecycle **draft → submitted → moderated → locked**. Only authorised users moderate/lock. Every change audited.

**Acceptance:** Score > max rejected; Faculty cannot edit locked; previous values traceable.

### BR-07 Fees

Total, paid, outstanding. Mock payment. Receipt. Duplicate submission prevented. All transactions labelled simulated. No real money movement.

**Acceptance:** `outstanding = total − paid`; invalid amounts rejected; idempotent payments.

### BR-08 Student risk insights

Rules use attendance and marks (and seeded trends if present). AI explains evidence only. AI never writes academic/fee rows. Provider failure → deterministic result still shown. Flags can create **mentor tasks**; no automatic punitive action.

**Acceptance:** Fixed rules win; missing data disclosed; invalid AI payload dropped.

### BR-09 Overview

Admin: students, attendance completion/today, outstanding dues, students to review, activity, marks awaiting moderation. Faculty: assigned classes, pending sync, marks status. Numbers are **this prototype’s data**, not trust-wide 7,800-student KPIs.

---

## 4. User stories (MVP backbone)

These will be split into smaller stories with given/when/then in Phase 1.

1. As Faculty, I mark today’s period so the college has a same-day record.  
2. As Faculty, I keep marking when Wi-Fi dies so the class is not lost.  
3. As Faculty, I see sync status so I know whether the office has my session.  
4. As Faculty, I enter IA marks and submit them without exceeding maxima.  
5. As Admin, I maintain CSE masters so rosters are correct.  
6. As Admin, I find a student by roll and see attendance, marks, and dues.  
7. As Admin, I moderate and lock marks so they cannot drift.  
8. As Admin, I record a demo payment and print/view a receipt.  
9. As Admin, I review why a student is flagged and create a mentor task.  
10. As either role, I use the product on a phone and a laptop without broken overflow.

---

## 5. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Fast navigation; paginated directories; no dashboard over-fetch |
| Reliability | Durable local attendance; idempotent APIs; explicit recovery |
| Security | Backend authz, validation, audit, secrets in env, synthetic PII |
| Accessibility | Contrast, labels, focus, status not color-only |
| Responsive | 1440, 1280, 1024, 768, 390, 360; recompose not shrink; ~44px targets |
| Honesty | No dead buttons, fake offline, fake AI, or fake compliance |

**DPDP Act 2023:** consider data minimisation and consent in design notes. **Do not claim legal compliance.**

---

## 6. Sample data policy

- Synthetic CSE students with mixed attendance, marks, dues.  
- One client example, verbatim: **Subhashree Mohanty, ENG-24-CSE-0412, B.Tech CSE, Year 2, 81.5%, 33/40, ₹0**.  
- No Management or Pharmacy students in the active MVP dataset.  
- Demo accounts only in deployed prototype.

---

## 7. Product voice (business-facing)

Calm, clear, professional. Friendly empty/offline copy. No slang in ledgers or marksheets. Miso does not appear on financial or dense academic grids.

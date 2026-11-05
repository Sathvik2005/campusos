# CampusOS — Phase 1: User personas

MVP has two authenticated personas. Students and parents are **beneficiaries**, not users.

Permissions are enforced on the **server**. UI hiding is insufficient.

---

## Persona F — Priya Nanda, Assistant Professor (Faculty)

| | |
| --- | --- |
| Role | `faculty` |
| Context | Teaches 2–3 CSE subjects to Year 2. Classrooms have unreliable Wi-Fi. Currently uses a paper register, then types into a spreadsheet at night. |
| Devices | Phone in class (360–390px), laptop in staff room |
| Success | Leave the room with attendance saved — online or queued — in under 30 seconds after the roster is on screen |
| Anxiety | “Did it actually go through?” / “If I mark twice will they be absent twice?” |

### Goals

- Open only **assigned** subject–batch classes  
- See the roster (roll, name)  
- Mark Present / Absent / Late, including Mark all present  
- Keep working **offline** after the roster was cached  
- Understand **Online / Offline / Pending / Syncing / Synced / Failed / Conflict**  
- Enter IA marks in draft, submit for moderation, see locked state  
- See own class attendance completion, not campus fee ledgers  

### Pain points

- Paper → delayed entry  
- Unclear submission status  
- Connectivity drops mid-class  
- Fear of overwriting or duplicating a period  

### Allowed

- Read/write attendance for **assigned** batch+subject, following PD-20 (unsynced editable; synced Faculty-read-only)  
- Read roster of assigned classes  
- Read/write **draft** marks for assigned components; submit  
- Read own submitted/locked marks (read-only)  
- Read Overview tailored to Faculty (assignments, pending sync count, marks status)  
- Cache roster locally for offline use  

### Prohibited

- Any Academic masters create/update/delete  
- Fees: view amounts, record payment, receipts  
- Lock, moderate, or unlock marks  
- View or mark **unassigned** classes  
- Create mentor tasks or run campus-wide Insights as Admin  
- See other faculty’s outbox or sessions  
- Impersonate Admin  
- Delete synced attendance  
- Call APIs that Admin uses and succeed  

### Copy tone

Practical, calm. Offline: “You're offline. Your work is safe on this device.”

---

## Persona A — S. Mohapatra, Office Superintendent (Office Admin)

| | |
| --- | --- |
| Role | `office_admin` |
| Context | Runs records for the Engineering campus office. Today: Excel admissions remnants, desktop student DB, department marksheets, 10-day fee reconciliation. Not a software engineer; needs a quiet, obvious UI. |
| Devices | Desktop 1280–1440 primary; tablet 768 occasional; phone for lookup |
| Success | Find a student in seconds; see dues; lock internals; know who needs a mentor conversation |
| Anxiety | Silent data loss, unofficial numbers, staff editing locked marks |

### Goals

- Maintain programme / batch / subject / faculty assignments for CSE  
- Search students by roll or name  
- Monitor attendance completion and shortage (<75%)  
- Moderate internals, lock, unlock with reason  
- See total / paid / outstanding; record **simulated** payment; open receipt  
- Review at-risk students with evidence; create mentor tasks  
- Trust audit history when something looks wrong  

### Pain points

- Fragmented records  
- Manual reconciliation  
- Inconsistent departmental spreadsheets  
- No timely view of who is slipping  

### Allowed

- CRUD academic masters within the **single MVP campus / CSE programme** (cannot invent a second campus or Pharmacy programme in MVP)  
- CRUD students in CSE batch (P1; seed covers P0)  
- Read all CSE attendance; **correct synced sessions with reason**  
- Moderate / lock / unlock marks with audit  
- Record simulated payments; view receipts and history  
- Generate/view risk assessments; create/complete mentor tasks  
- Read audit for academic and fee events  

### Prohibited

- Real money capture  
- Changing risk **category** by typing a different label if rules disagree (may add notes on the task, not override PD-05)  
- Asking AI to rewrite marks or dues  
- Accessing other campuses/programmes (they do not exist in MVP)  
- Deleting audit rows  
- Claiming DPDP-complete consent workflows  

### Copy tone

Professional, short. Fees: “Payment recorded in demo mode.” Marks: “Assessment secured. Changes are now restricted.”

---

## Shared

| | Faculty | Office Admin |
| --- | --- | --- |
| Must authenticate | Yes | Yes |
| Synthetic data only | Yes | Yes |
| Responsive UI | Mobile-first attendance | Desktop-first admin, still usable on phone |
| Dead buttons | None | None |

---

## Non-personas (do not build UI for)

Student, parent, principal multi-campus dashboard, accountant with live bank files, admissions counsellor, hostel warden.

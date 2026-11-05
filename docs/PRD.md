# CampusOS — Product Requirements Document

**Product:** CampusOS  
**Tagline:** Campus life, in sync.  
**Client:** Company A, Bhubaneswar  
**Assignment:** Isocode Labs — Software Engineering Intern  
**Version:** 1.1  
**Status:** Initial product specification (awaiting architecture approval)  
**Target submission:** 5 November 2026  
**Official deadline:** 9 November 2026

---

## 1. Product vision

CampusOS is a modern, offline-first academic operations platform that connects the everyday administrative and academic workflows of a college.

It replaces fragmented spreadsheets, paper registers and disconnected records with one reliable workspace.

The first release focuses on **one campus** and **one academic programme**.

Its defining capability is reliable attendance management, including the ability to record attendance without an internet connection and synchronize it safely when connectivity returns.

**Product promise:** Campus operations continue, even when the internet doesn't.

**Product positioning:** An offline-first academic operations workspace for modern colleges.

CampusOS should look like a product people would happily use every day, not software they are forced to use because their college purchased it. Assignment technical requirements always take priority over visual decoration.

---

## 2. The client problem

Company A operates three colleges with 7,800 students and 520 teaching staff.

Current workflows depend on:

- Excel-based admissions
- Legacy desktop student records
- Paper-based attendance
- Department-specific marks spreadsheets
- Manual fee reconciliation
- Manually compiled institutional reports

This results in duplicated information, delayed updates, administrative overhead and poor visibility.

CampusOS addresses the first phase of this problem through a unified academic operations workflow.

---

## 3. Product personality

- Calm, not boring
- Intelligent, not intimidating
- Youthful, not childish
- Professional, not corporate-heavy
- Helpful, not overwhelming

Voice is concise, friendly and professional. Gen Z energy comes from visual confidence and product voice, not slang, memes or emoji-heavy records.

---

## 4. Product goals

### Primary goals

1. Provide a centralized student and academic record system.
2. Enable faculty to record attendance on mobile devices.
3. Make attendance work without internet connectivity.
4. Allow internal marks to be entered and moderated safely.
5. Give administrators visibility into outstanding student fees.
6. Identify students who may need academic intervention.
7. Provide clear, role-appropriate interfaces.

### Success indicators (client-stated)

- 95% of classes should have attendance entered on the same day.
- University mark uploads should require no re-typing.
- Monthly fee reconciliation should reduce from ten days to one.

The prototype **demonstrates supporting workflows**. It must not claim these institutional outcomes have already been achieved.

### Prototype analytics (safe to track)

- Attendance sessions created
- Attendance records synchronized
- Pending synchronization count
- Duplicate submissions prevented
- Marks submitted and locked
- Fee dues and simulated payments
- Risk assessments created
- Mentor tasks created

Do not present simulated product metrics as real client outcomes.

---

## 5. Scope

### Included in the core release

- One campus
- One programme: B.Tech CSE
- Faculty and Office Admin roles
- Academic masters
- Student records
- Mobile attendance
- Offline attendance and synchronization
- Internal assessment marks
- Moderation and locking
- Fee dues
- Mock payment transactions
- Explainable student risk flags

### Excluded from the initial release

- Three-campus rollout
- Full admissions management
- Parent portals
- Staff leave
- Payroll
- Timetable generation
- Hostel, transport and library
- Real payment gateway integrations
- Real SMS or WhatsApp messaging
- Full university / AICTE / NAAC integrations
- Natural-language reporting assistant, unless time permits after the core is complete

---

## 6. User personas

### Persona A — Faculty

**Primary need:** Complete classroom attendance and marks entry quickly.

**Goals**

- Access assigned classes
- See the enrolled student roster
- Mark attendance on a mobile device
- Work without internet
- Understand synchronization status
- Enter internal marks
- Know whether marks are locked

**Pain points**

- Paper attendance
- Repeated data entry
- Unreliable classroom connectivity
- Unclear submission status

### Persona B — Office Admin

**Primary need:** Maintain accurate academic and financial records.

**Goals**

- Manage academic masters
- View students
- Monitor attendance
- Review marks
- Moderate and lock marks
- Monitor fee dues
- Review risk flags
- Create mentor follow-up tasks

**Pain points**

- Fragmented records
- Manual reconciliation
- Inconsistent departmental data
- Lack of timely reporting

---

## 7. Functional requirements

### FR-01: Authentication and authorization

- Users must sign in.
- Support Faculty and Office Admin roles.
- Faculty can access assigned classes only.
- Office Admin can manage records within the selected campus.
- Server-side authorization must protect sensitive actions.

**Acceptance**

- Unauthenticated users cannot access protected routes.
- Faculty cannot modify administrative records.
- Unauthorized API calls are rejected.
- Database policies enforce access restrictions.

### FR-02: Academic masters

Manage campus, programme, academic year, batch, subject, faculty, and faculty–subject assignments.

**Initial configuration**

- One campus
- B.Tech CSE
- Second-year sample batch
- Synthetic subjects and faculty assignments

**Acceptance**

- Admin can create and update masters.
- Invalid records are rejected.
- Relationships are validated.
- Faculty see only assigned subjects.

### FR-03: Student directory

Display roll number, student name, programme and year, attendance percentage, internal marks, outstanding fees.

**Acceptance**

- Search by roll number or student name.
- Filter by batch.
- Open a student detail view.
- Show realistic synthetic data.

### FR-04: Offline attendance (flagship)

- Display assigned class roster.
- Select attendance session.
- Mark Present, Absent or Late.
- Support Mark All Present.
- Persist locally in IndexedDB.
- Maintain a synchronization queue.
- Synchronize when online.
- Prevent duplicate submissions.
- Preserve pending records across refresh and restart.
- Display sync status.
- Complete a typical class in **under 30 seconds** once the roster is loaded.

**Acceptance**

- Attendance can be recorded without connectivity.
- Pending attendance survives browser restart.
- Reconnection triggers synchronization.
- Repeated requests do not duplicate records.
- Failed synchronization does not destroy local records.
- Server-side permissions are checked.

### FR-05: Internal marks

- Support assessment components and maximum marks.
- Validate entered values.
- Save drafts.
- Submit marks for moderation.
- Allow Admin moderation.
- Lock moderated marks.
- Record changes in audit history.

**Acceptance**

- Marks cannot exceed component maximum.
- Locked marks cannot be modified by Faculty.
- Every authorized modification creates an audit event.
- Previous values remain traceable.

### FR-06: Fee management

- Display total fees, paid amount, outstanding balance.
- Record mock payments.
- Generate receipts.
- Display payment history.

**Acceptance**

- Outstanding balance is calculated correctly.
- Duplicate payment submissions are prevented.
- Invalid transaction amounts are rejected.
- All transactions are marked as simulated.

### FR-07: Student risk intelligence

Analyze attendance percentage, internal marks, and available historical trends.

Produce risk category, evidence, explanation, confidence / data sufficiency, and suggested mentor follow-up.

**Acceptance**

- Fixed institutional thresholds take precedence.
- Missing data is disclosed.
- AI cannot modify student records.
- Invalid AI output is rejected.
- AI provider failure produces a safe fallback.
- Risk flags can create mentor tasks.

---

## 8. Core user journeys

### Faculty attendance

1. Sign in.
2. Open assigned class.
3. Select subject and period.
4. Load roster.
5. Mark attendance.
6. Save session.
7. If offline, persist locally.
8. On reconnect, synchronize queued records.
9. See final synchronization status.

### Faculty marks

1. Sign in.
2. Open assigned subject.
3. Select assessment component.
4. Enter marks.
5. Validate and save.
6. Submit for moderation.
7. See moderation status.

### Admin moderation

1. Open submitted marks.
2. Review student-wise values.
3. Make authorized corrections if necessary.
4. Record moderation reason.
5. Lock marks.
6. Review audit history.

### Admin fees

1. Open fee dashboard.
2. Search for a student.
3. View total, paid and outstanding.
4. Record a mock payment.
5. View updated balance.
6. Open generated receipt.

### Admin risk

1. Open student risk monitoring.
2. Review flagged students.
3. Examine attendance and marks evidence.
4. Review explanation.
5. Create a mentor follow-up task.

---

## 9. Navigation

Primary navigation:

1. Overview
2. Students
3. Academics
4. Attendance
5. Marks
6. Fees
7. Student Insights

Role-specific navigation and actions must be enforced on the **server**, not just hidden in the interface.

Faculty see only modules they can use (Attendance, Marks, and a focused Overview). Admin sees the full workspace.

---

## 10. Non-functional requirements

### Performance

- Fast navigation
- Efficient database queries
- Paginated student lists where appropriate
- Avoid unnecessary dashboard queries

### Reliability

- Durable local attendance persistence
- Idempotent synchronization
- Explicit error recovery
- Safe database transactions

### Security

- Authentication
- Server-side authorization
- Row Level Security
- Input validation
- Secret management
- Auditability
- Synthetic sample data only

### Accessibility

- Clear contrast
- Keyboard navigation
- Descriptive labels
- Visible focus states
- Accessible status indicators

### Responsive design (mandatory)

CampusOS must be a genuine responsive application, not a scaled-down desktop site.

| Category | Viewports |
| --- | --- |
| Desktop | 1440px, 1280px, 1024px |
| Tablet | 768px |
| Mobile | 390px, 360px |

Non-negotiable:

- No horizontal page overflow
- Tables must have deliberate mobile alternatives
- Touch targets generally at least 44 × 44 CSS pixels
- Forms must work with mobile keyboards
- Dialogs become mobile-friendly sheets where appropriate
- Navigation remains accessible
- Loading, empty, offline, error and success states exist at every relevant breakpoint
- Attendance marking remains easy to reach with one hand

See `docs/DESIGN_SYSTEM.md` and `docs/RESPONSIVE_CONTRACT.md`.

---

## 11. AI architecture (product rules)

AI is an assistant to institutional decision-making, not an authority over academic records.

Separate:

1. Verified student metrics
2. Deterministic risk rules
3. AI-generated explanations
4. Human-approved mentor actions

AI must never change marks, attendance or fee records; override fixed rules; or invent missing student history.

When the model fails, the deterministic assessment remains available and the UI clearly indicates that the explanation service is unavailable.

---

## 12. Sample data

Use the client-provided record exactly:

| Field | Value |
| --- | --- |
| Name | Subhashree Mohanty |
| Roll | ENG-24-CSE-0412 |
| Programme | B.Tech CSE |
| Year | 2 |
| Attendance | 81.5% |
| Internal marks | 33/40 |
| Fee due | ₹0 |

Create additional **fictional** CSE records with a range of attendance, marks and dues. No real student personal data.

---

## 13. Assumptions

See `docs/ASSUMPTIONS.md`. High-level:

1. First release operates on one campus.
2. B.Tech CSE is the initial programme.
3. Initial batch is second year.
4. Faculty assignments are seeded for the prototype.
5. Mock payments do not transfer money.
6. Initial AI assessment uses synthetic data.
7. Historical trends may be synthetically seeded.
8. Deployed prototype uses test accounts.
9. Full parent consent and DPDP workflows are outside prototype scope and must not be represented as fully implemented.

---

## 14. Quality rules

- No dead buttons
- No fake backend functionality
- No decorative offline indicators
- No fake AI
- No unauthorized database access
- No secrets in Git
- No real student personal data
- No unnecessary UI decoration
- No unverified implementation claims

If offline sync is not reliable, reduce optional UI polish and secondary features rather than fake the functionality.

---

## 15. Product promise (final)

CampusOS is an offline-first academic operations workspace.

It is designed to feel dependable enough for institutional operations and intuitive enough for everyday use.

**Campus life, in sync.**

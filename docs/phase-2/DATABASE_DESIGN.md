# CampusOS — Phase 2: Database design

PostgreSQL via SQLAlchemy 2.x + Alembic. FastAPI is the only application writer.

Enums: `user_role (faculty, office_admin)`, `attendance_status (present, absent, late)`, `marks_lifecycle (draft, submitted, moderated, locked)`, `risk_category (on_track, watch, at_risk)`, `explanation_status (pending, available, unavailable)`, `payment_kind (simulated)`, `mentor_task_status (open, in_progress, completed, cancelled)`.

All tables: `id uuid PK default gen_random_uuid()`, `created_at timestamptz`, `updated_at timestamptz` unless noted.

| Table | Purpose | Key columns | Uniques / checks | Indexes |
| --- | --- | --- | --- | --- |
| campuses | One MVP campus | name, city | | |
| programmes | B.Tech CSE | campus_id FK, code, name, duration_years | unique (campus_id, code) | campus_id |
| academic_years | Calendar | campus_id, label, starts_on, ends_on | unique (campus_id, label) | |
| batches | Year 2 section | programme_id, academic_year_id, year_of_study, section | unique (programme_id, academic_year_id, year_of_study, section) | |
| subjects | Courses | programme_id, code, name, credits | unique (programme_id, code) | |
| faculty | Teachers | campus_id, full_name, employee_code, email | unique email, employee_code | |
| faculty_subject_assignments | Who teaches what | faculty_id, subject_id, batch_id | unique (faculty_id, subject_id, batch_id) | faculty_id |
| profiles | Auth user mapping | id = auth.users.id, role, campus_id, faculty_id null, display_name | faculty_id required when role=faculty (app + check) | role |
| students | CSE cohort | batch_id, roll_number, full_name, year_of_study | unique roll_number | roll_number, batch_id |
| attendance_sessions | One period | idempotency_key, batch_id, subject_id, faculty_id, held_on date, period int | unique idempotency_key; unique (batch_id, subject_id, held_on, period); period 1–8 | faculty_id, held_on |
| attendance_records | Per student | session_id, student_id, status, marked_at | unique (session_id, student_id) | student_id |
| assessment_components | IA-1 / IA-2 | subject_id, batch_id, name, max_marks numeric(6,2), lifecycle, submitted_at, locked_at, locked_by | unique (subject_id, batch_id, name) | |
| marks | Scores | component_id, student_id, score numeric(6,2) | unique (component_id, student_id); score >= 0; trigger score <= max | student_id |
| marks_audit | Immutable marks history | component_id, student_id, actor_id, old_score, new_score, reason, from/to lifecycle | | component_id |
| fee_plans | Programme fee total | programme_id, academic_year_id, total_amount numeric(12,2) | unique (programme_id, academic_year_id); total > 0 | |
| fee_accounts | Per student | student_id, plan_id | unique student_id | |
| fee_payments | Simulated pay | account_id, amount numeric(12,2), kind, idempotency_key, recorded_by | unique idempotency_key; amount > 0 | account_id |
| receipts | Demo receipts | payment_id, receipt_number | unique payment_id, receipt_number | |
| risk_assessments | Snapshot | student_id, category, attendance_pct, internals_score/max, evidence jsonb, explanation, explanation_status, confidence, rule_version | | student_id, created_at |
| mentor_tasks | Human follow-up | student_id, assessment_id null, title, notes, status, due_on, assignee_profile_id null, created_by | | student_id, status |
| audit_events | Generic audit | actor_id, action, entity_type, entity_id, old_value jsonb, new_value jsonb, reason, created_at | no updates via API | entity_type, created_at |

**Attendance %** and **outstanding** are computed, not stored as source of truth (views OK).

**Migrations:** linear Alembic in `backend/alembic`. Never rewrite applied revisions. Never `supabase db reset` on remote.

**Seed:** one campus, CSE, AY, Y2 batch, ~6 subjects, ~3 faculty, ~60 students including Subhashree Mohanty ENG-24-CSE-0412 81.5% / 33/40 / ₹0 (pre-seed attendance/marks/fees to match).

Example model sketch (not production code):

```python
class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = (
        UniqueConstraint("idempotency_key"),
        UniqueConstraint("batch_id", "subject_id", "held_on", "period"),
        CheckConstraint("period >= 1 AND period <= 8"),
    )
```

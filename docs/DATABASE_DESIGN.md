# CampusOS — Database design

PostgreSQL on Supabase. All tables live in `public`. RLS enabled on every table. Synthetic data only.

---

## 1. Enums

```sql
create type user_role as enum ('faculty', 'office_admin');
create type attendance_status as enum ('present', 'absent', 'late');
create type session_sync_state as enum ('pending', 'synced'); -- local UI has richer states
create type marks_lifecycle as enum ('draft', 'submitted', 'moderated', 'locked');
create type risk_category as enum ('on_track', 'watch', 'at_risk');
create type explanation_status as enum ('pending', 'available', 'unavailable');
create type payment_kind as enum ('simulated');
create type mentor_task_status as enum ('open', 'done');
```

---

## 2. Core academic graph

```
campuses 1──* programmes 1──* batches
                │
                └──* subjects
                      │
faculty 1──* faculty_subject_assignments *──1 subjects
                      │
                      └──* batches (assignment scope)

students *──1 batches
```

### `campuses`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| name | text not null | Seeded: Company A campus (prototype) |
| city | text | Bhubaneswar |
| created_at | timestamptz | |

### `programmes`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| campus_id | uuid fk | |
| code | text | `BTECH-CSE` unique per campus |
| name | text | B.Tech CSE |
| duration_years | int | 4 |

### `academic_years`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| campus_id | uuid fk | |
| label | text | `2024-25` |
| starts_on | date | |
| ends_on | date | |

### `batches`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| programme_id | uuid fk | |
| academic_year_id | uuid fk | |
| year_of_study | int | 2 for seed |
| section | text | `A` |
| unique | (programme_id, academic_year_id, year_of_study, section) | |

### `subjects`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| programme_id | uuid fk | |
| code | text | |
| name | text | |
| credits | int | |

### `faculty`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| campus_id | uuid fk | |
| full_name | text | |
| employee_code | text unique | |
| email | text unique | Matches auth user |

### `faculty_subject_assignments`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| faculty_id | uuid fk | |
| subject_id | uuid fk | |
| batch_id | uuid fk | |
| unique | (faculty_id, subject_id, batch_id) | |

### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | `auth.users.id` |
| role | user_role not null | |
| campus_id | uuid fk | |
| faculty_id | uuid fk null | Required when role = faculty |
| display_name | text | |

---

## 3. Students

### `students`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| batch_id | uuid fk | |
| roll_number | text unique | `ENG-24-CSE-0412` |
| full_name | text | |
| year_of_study | int | Denormalized for directory speed; must match batch |
| created_at | timestamptz | |

Client sample row: Subhashree Mohanty, ENG-24-CSE-0412, year 2.

Attendance % and internals are **not** stored as source of truth on this table. They are derived (materialized view or query). A `student_directory_view` may cache computed fields for the UI.

---

## 4. Attendance

### `attendance_sessions`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | Server id |
| idempotency_key | uuid unique not null | Client-generated |
| batch_id | uuid fk | |
| subject_id | uuid fk | |
| faculty_id | uuid fk | |
| held_on | date not null | Asia/Kolkata date |
| period | int not null | 1–8 |
| submitted_at | timestamptz | |
| created_at | timestamptz | |
| unique | (batch_id, subject_id, held_on, period) **or** rely on idempotency + app rule | Prefer unique natural key **and** idempotency_key to stop duplicates from retries *and* double saves |

Natural unique `(batch_id, subject_id, held_on, period)`: if faculty retries a different key for the same class, upsert the existing session instead of inserting a second period.

### `attendance_records`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| session_id | uuid fk | |
| student_id | uuid fk | |
| status | attendance_status not null | |
| marked_at | timestamptz | |
| unique | (session_id, student_id) | |

Indexes: `attendance_sessions (faculty_id, held_on)`, `attendance_records (student_id)`.

---

## 5. Marks

### `assessment_components`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| subject_id | uuid fk | |
| batch_id | uuid fk | |
| name | text | IA-1, IA-2 |
| max_marks | numeric(6,2) | |
| lifecycle | marks_lifecycle | default draft |
| submitted_at | timestamptz null | |
| locked_at | timestamptz null | |
| locked_by | uuid null | profile id |

### `marks`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| component_id | uuid fk | |
| student_id | uuid fk | |
| score | numeric(6,2) not null | 0..max, checked in constraint + trigger |
| unique | (component_id, student_id) | |

### `marks_audit`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| component_id | uuid | |
| student_id | uuid | |
| actor_id | uuid | |
| actor_role | user_role | |
| old_score | numeric null | |
| new_score | numeric null | |
| reason | text null | Required for admin corrections |
| from_lifecycle | marks_lifecycle null | |
| to_lifecycle | marks_lifecycle null | |
| created_at | timestamptz | |

Trigger: any update/delete on `marks` when component is `locked` is rejected. Faculty cannot update after `submitted` except if we allow draft-only — **policy:** Faculty write when `draft`; Admin write when `submitted` or `moderated` and not `locked`.

---

## 6. Fees

### `fee_plans`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| programme_id | uuid | |
| academic_year_id | uuid | |
| total_amount | numeric(12,2) | |

### `fee_accounts`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| student_id | uuid unique | |
| plan_id | uuid | |

Outstanding is computed: `plan.total_amount - coalesce(sum(payments.amount),0)`.

### `fee_payments`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| account_id | uuid | |
| amount | numeric(12,2) check > 0 | |
| kind | payment_kind | always `simulated` |
| idempotency_key | uuid unique | |
| recorded_by | uuid | admin profile |
| recorded_at | timestamptz | |
| note | text | |

### `receipts`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| payment_id | uuid unique | |
| receipt_number | text unique | `DEMO-RCPT-000123` |
| issued_at | timestamptz | |

---

## 7. Risk and mentoring

### `risk_assessments`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| student_id | uuid | |
| category | risk_category | From **rules**, not the model |
| attendance_pct | numeric(5,2) | Snapshot |
| internals_score | numeric | Snapshot |
| internals_max | numeric | |
| evidence | jsonb | Structured facts only |
| explanation | text null | Model or null |
| explanation_status | explanation_status | |
| confidence | text | `sufficient` / `limited` / `insufficient` |
| created_at | timestamptz | |
| created_by | uuid | |

### `mentor_tasks`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| student_id | uuid | |
| assessment_id | uuid null | |
| title | text | |
| notes | text | |
| status | mentor_task_status | |
| created_by | uuid | Admin |
| created_at | timestamptz | |

AI has no insert privilege. Tasks are created by Admin actions only.

---

## 8. Derived views (recommended)

`student_directory_view`

- student identity
- attendance_pct over sessions to date
- internals sum / max
- outstanding_fees

Keep the view read-only. Do not write percentages back onto `students` except via a nightly job if we need speed — v1 can compute in SQL.

---

## 9. RLS sketch

Deny by default. `authenticated` only.

| Table | Faculty | Office Admin |
| --- | --- | --- |
| profiles | read self | read campus |
| academic masters | read assigned | CRUD campus |
| students | read if in assigned batch+subject | read/write campus |
| attendance_* | insert/update own sessions | read campus |
| assessment_components / marks | write assigned + draft | moderate/lock |
| marks_audit | read assigned | read campus |
| fee_* | **no access** | CRUD simulated payments |
| risk_* / mentor_tasks | read assigned students optional | CRUD |

Helper functions:

- `is_admin()`
- `is_faculty()`
- `faculty_assigned(subject_id, batch_id)`
- `same_campus(campus_id)`

Service role used only in seed scripts and never in the browser.

---

## 10. Idempotency and integrity

- `attendance_sessions.idempotency_key` unique
- `attendance_sessions` natural unique on class period
- `attendance_records` unique (session, student)
- `fee_payments.idempotency_key` unique
- `marks` unique (component, student)
- Check: `marks.score >= 0` and trigger vs `max_marks`
- Check: payment amount ≤ outstanding unless we allow advance — **v1: amount must be > 0 and ≤ outstanding**

---

## 11. Seed outline

1. One campus, B.Tech CSE, AY 2024-25, Year 2 section A.
2. ~6 subjects, ~3 faculty, assignments covering all subjects.
3. ~60 students including **Subhashree Mohanty / ENG-24-CSE-0412 / 81.5% / 33/40 / ₹0**.
4. Remaining students: fictional names, mixed attendance, marks, dues.
5. Demo auth: `admin@campusos.dev`, `faculty@campusos.dev` (passwords in `.env.example` as placeholders, real secrets local only).
6. Optional synthetic historical attendance so trends exist on Insights.

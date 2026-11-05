"""Request/response schemas. Requests forbid unknown fields (no mass assignment) and never carry
role, campus_id or user ids."""
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class In(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- auth / platform
class MeOut(Out):
    id: uuid.UUID
    role: str
    display_name: str
    faculty_id: uuid.UUID | None


class Page(BaseModel):
    total: int
    page: int
    page_size: int


# ---- academic masters
class ProgrammeIn(In):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=120)
    duration_years: int = Field(default=4, ge=1, le=6)


class ProgrammeOut(Out):
    id: uuid.UUID
    code: str
    name: str
    duration_years: int
    is_active: bool


class AcademicYearIn(In):
    label: str = Field(min_length=1, max_length=20)
    starts_on: date
    ends_on: date


class AcademicYearOut(Out):
    id: uuid.UUID
    label: str
    starts_on: date
    ends_on: date
    is_active: bool


class BatchIn(In):
    programme_id: uuid.UUID
    academic_year_id: uuid.UUID
    year_of_study: int = Field(ge=1, le=6)
    section: str = Field(min_length=1, max_length=10)


class BatchOut(Out):
    id: uuid.UUID
    programme_id: uuid.UUID
    academic_year_id: uuid.UUID
    year_of_study: int
    section: str
    is_active: bool


class SubjectIn(In):
    programme_id: uuid.UUID
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=120)
    credits: int = Field(default=3, ge=1, le=10)


class SubjectOut(Out):
    id: uuid.UUID
    programme_id: uuid.UUID
    code: str
    name: str
    credits: int
    is_active: bool


class FacultyIn(In):
    full_name: str = Field(min_length=1, max_length=120)
    employee_code: str = Field(min_length=1, max_length=30)
    email: str = Field(min_length=3, max_length=160, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class FacultyOut(Out):
    id: uuid.UUID
    full_name: str
    employee_code: str
    email: str
    is_active: bool


class AssignmentIn(In):
    faculty_id: uuid.UUID
    subject_id: uuid.UUID
    batch_id: uuid.UUID


class AssignmentOut(Out):
    id: uuid.UUID
    faculty_id: uuid.UUID
    subject_id: uuid.UUID
    batch_id: uuid.UUID


class ActiveIn(In):
    is_active: bool


# ---- students
class StudentIn(In):
    batch_id: uuid.UUID
    roll_number: str = Field(min_length=1, max_length=30)
    full_name: str = Field(min_length=1, max_length=120)


class StudentUpdate(In):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    status: Literal["active", "inactive"] | None = None


class StudentRow(Out):
    id: uuid.UUID
    roll_number: str
    full_name: str
    batch_id: uuid.UUID
    year_of_study: int
    status: str


class FeeSummaryOut(BaseModel):
    total: Decimal
    paid: Decimal
    outstanding: Decimal


class StudentDetail(StudentRow):
    attendance_pct: Decimal | None
    internals_score: Decimal | None
    internals_max: Decimal | None
    fees: FeeSummaryOut | None = None   # present for Office Admin only


class StudentList(Page):
    items: list[StudentRow]


# ---- attendance
class AttendanceMark(In):
    student_id: uuid.UUID
    status: Literal["present", "absent", "late"]


class SyncIn(In):
    idempotency_key: uuid.UUID
    batch_id: uuid.UUID
    subject_id: uuid.UUID
    held_on: date
    period: int = Field(ge=1, le=8)
    records: list[AttendanceMark] = Field(min_length=1, max_length=500)


class SyncOut(BaseModel):
    session_id: uuid.UUID
    created: bool
    record_count: int


class RosterEntry(Out):
    id: uuid.UUID
    roll_number: str
    full_name: str


class RosterOut(BaseModel):
    batch_id: uuid.UUID
    subject_id: uuid.UUID
    students: list[RosterEntry]


class SessionOut(Out):
    id: uuid.UUID
    batch_id: uuid.UUID
    subject_id: uuid.UUID
    faculty_id: uuid.UUID
    held_on: date
    period: int


class SessionRecordOut(Out):
    student_id: uuid.UUID
    status: str


class SessionDetail(SessionOut):
    records: list[SessionRecordOut]


class CorrectionIn(In):
    reason: str = Field(min_length=1, max_length=500)
    records: list[AttendanceMark] = Field(min_length=1, max_length=500)


# ---- marks
class ComponentIn(In):
    subject_id: uuid.UUID
    batch_id: uuid.UUID
    name: str = Field(min_length=1, max_length=40)
    max_marks: Decimal = Field(gt=0, max_digits=6, decimal_places=2)


class ComponentOut(Out):
    id: uuid.UUID
    subject_id: uuid.UUID
    batch_id: uuid.UUID
    name: str
    max_marks: Decimal
    lifecycle: str
    submitted_at: datetime | None
    locked_at: datetime | None


class ScoreIn(In):
    student_id: uuid.UUID
    score: Decimal = Field(max_digits=6, decimal_places=2)


class ScoresIn(In):
    scores: list[ScoreIn] = Field(min_length=1, max_length=500)
    reason: str | None = Field(default=None, max_length=500)


class ReasonIn(In):
    reason: str = Field(min_length=1, max_length=500)


class ScoreOut(Out):
    student_id: uuid.UUID
    score: Decimal


class ComponentDetail(ComponentOut):
    scores: list[ScoreOut]


class MarksAuditOut(Out):
    id: uuid.UUID
    student_id: uuid.UUID | None
    actor_id: uuid.UUID
    old_score: Decimal | None
    new_score: Decimal | None
    from_lifecycle: str | None
    to_lifecycle: str | None
    reason: str | None
    created_at: datetime


# ---- fees
class FeeAccountOut(BaseModel):
    student_id: uuid.UUID
    roll_number: str
    full_name: str
    total: Decimal
    paid: Decimal
    outstanding: Decimal


class PaymentIn(In):
    idempotency_key: uuid.UUID
    student_id: uuid.UUID
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class PaymentOut(Out):
    id: uuid.UUID
    amount: Decimal
    kind: str
    created_at: datetime


class ReceiptOut(BaseModel):
    receipt_number: str
    amount: Decimal
    kind: str
    simulated: bool = True
    notice: str = "Simulated payment recorded in demo mode. No real money moved."
    created_at: datetime


class PaymentResult(BaseModel):
    payment: PaymentOut
    receipt: ReceiptOut
    created: bool
    outstanding: Decimal


class AccountDetail(FeeAccountOut):
    payments: list[PaymentOut]


# ---- insights
class IndicatorOut(BaseModel):
    code: str
    text: str


class AssessmentOut(BaseModel):
    id: uuid.UUID | None = None
    student_id: uuid.UUID
    category: str
    confidence: str
    indicators: list[IndicatorOut]
    attendance_pct: Decimal | None
    internals_score: Decimal | None
    internals_max: Decimal | None
    rule_version: str
    explanation: str | None = None
    explanation_status: str = "unavailable"
    explanation_note: str = "Explanation not generated."
    persisted: bool = False
    created_at: datetime | None = None


class AtRiskRow(BaseModel):
    student_id: uuid.UUID
    roll_number: str
    full_name: str
    category: str
    confidence: str
    indicators: list[IndicatorOut]
    attendance_pct: Decimal | None
    internals_score: Decimal | None
    internals_max: Decimal | None
    rule_version: str


class TaskIn(In):
    student_id: uuid.UUID
    title: str = Field(min_length=1, max_length=160)
    notes: str | None = Field(default=None, max_length=2000)
    due_on: date | None = None
    assignee_faculty_id: uuid.UUID | None = None
    assessment_id: uuid.UUID | None = None


class TaskStatusIn(In):
    status: Literal["in_progress", "completed", "cancelled"]
    reason: str | None = Field(default=None, max_length=500)


class TaskOut(Out):
    id: uuid.UUID
    student_id: uuid.UUID
    title: str
    notes: str | None
    status: str
    due_on: date | None
    assignee_faculty_id: uuid.UUID | None
    assessment_id: uuid.UUID | None


# ---- audit
class AuditOut(Out):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    old_value: dict | None
    new_value: dict | None
    reason: str | None
    created_at: datetime


class AuditList(Page):
    items: list[AuditOut]

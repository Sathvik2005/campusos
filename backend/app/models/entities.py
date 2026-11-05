"""SQLAlchemy models. Source: docs/phase-2/DATABASE_DESIGN.md (+ campus_id on students/batches and
payload_hash on attendance sessions so idempotent replay can be told apart from a conflicting payload).
Enum-like columns are String + CHECK so the schema is portable; the DB remains the final guard."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (JSON, Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, Numeric, String, Text,
                        UniqueConstraint, Uuid)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Stamped:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Campus(Stamped, Base):
    __tablename__ = "campuses"
    name: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(80))


class Programme(Stamped, Base):
    __tablename__ = "programmes"
    __table_args__ = (UniqueConstraint("campus_id", "code"),)
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), index=True)
    code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(120))
    duration_years: Mapped[int] = mapped_column(Integer, default=4)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AcademicYear(Stamped, Base):
    __tablename__ = "academic_years"
    __table_args__ = (UniqueConstraint("campus_id", "label"), CheckConstraint("ends_on > starts_on"))
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), index=True)
    label: Mapped[str] = mapped_column(String(20))
    starts_on: Mapped[date] = mapped_column(Date)
    ends_on: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Batch(Stamped, Base):
    __tablename__ = "batches"
    __table_args__ = (UniqueConstraint("programme_id", "academic_year_id", "year_of_study", "section"),
                      CheckConstraint("year_of_study >= 1 AND year_of_study <= 6"))
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), index=True)
    programme_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("programmes.id"))
    academic_year_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("academic_years.id"))
    year_of_study: Mapped[int] = mapped_column(Integer)
    section: Mapped[str] = mapped_column(String(10))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Subject(Stamped, Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("programme_id", "code"),)
    programme_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("programmes.id"), index=True)
    code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(120))
    credits: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Faculty(Stamped, Base):
    __tablename__ = "faculty"
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    employee_code: Mapped[str] = mapped_column(String(30), unique=True)
    email: Mapped[str] = mapped_column(String(160), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class FacultySubjectAssignment(Stamped, Base):
    __tablename__ = "faculty_subject_assignments"
    __table_args__ = (UniqueConstraint("faculty_id", "subject_id", "batch_id"),)
    faculty_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("faculty.id"), index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id"))
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("batches.id"))


class Profile(Stamped, Base):
    """Maps a Supabase auth user (id == JWT `sub`) to a role. Role is never taken from a request."""
    __tablename__ = "profiles"
    __table_args__ = (CheckConstraint("role IN ('faculty','office_admin')"),
                      CheckConstraint("role <> 'faculty' OR faculty_id IS NOT NULL"))
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"))
    role: Mapped[str] = mapped_column(String(20), index=True)
    faculty_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("faculty.id"), nullable=True)
    display_name: Mapped[str] = mapped_column(String(120))


class Student(Stamped, Base):
    __tablename__ = "students"
    campus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campuses.id"), index=True)
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("batches.id"), index=True)
    roll_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), index=True)
    year_of_study: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="active")


class AttendanceSession(Stamped, Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = (UniqueConstraint("idempotency_key"),
                      UniqueConstraint("batch_id", "subject_id", "held_on", "period"),
                      CheckConstraint("period >= 1 AND period <= 8"))
    idempotency_key: Mapped[uuid.UUID] = mapped_column(Uuid)
    payload_hash: Mapped[str] = mapped_column(String(64))
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("batches.id"))
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id"))
    faculty_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("faculty.id"), index=True)
    held_on: Mapped[date] = mapped_column(Date, index=True)
    period: Mapped[int] = mapped_column(Integer)
    records: Mapped[list["AttendanceRecord"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Stamped, Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("session_id", "student_id"),
                      CheckConstraint("status IN ('present','absent','late')"))
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("attendance_sessions.id"))
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), index=True)
    status: Mapped[str] = mapped_column(String(10))
    marked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    session: Mapped[AttendanceSession] = relationship(back_populates="records")


class AssessmentComponent(Stamped, Base):
    __tablename__ = "assessment_components"
    __table_args__ = (UniqueConstraint("subject_id", "batch_id", "name"),
                      CheckConstraint("max_marks > 0"),
                      CheckConstraint("lifecycle IN ('draft','submitted','moderated','locked')"))
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id"))
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("batches.id"))
    name: Mapped[str] = mapped_column(String(40))
    max_marks: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    lifecycle: Mapped[str] = mapped_column(String(12), default="draft")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)


class Mark(Stamped, Base):
    __tablename__ = "marks"
    __table_args__ = (UniqueConstraint("component_id", "student_id"), CheckConstraint("score >= 0"))
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessment_components.id"))
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), index=True)
    score: Mapped[Decimal] = mapped_column(Numeric(6, 2))


class MarksAudit(Stamped, Base):
    __tablename__ = "marks_audit"
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assessment_components.id"), index=True)
    student_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    old_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    new_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    from_lifecycle: Mapped[str | None] = mapped_column(String(12), nullable=True)
    to_lifecycle: Mapped[str | None] = mapped_column(String(12), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class FeePlan(Stamped, Base):
    __tablename__ = "fee_plans"
    __table_args__ = (UniqueConstraint("programme_id", "academic_year_id"), CheckConstraint("total_amount > 0"))
    programme_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("programmes.id"))
    academic_year_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("academic_years.id"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))


class FeeAccount(Stamped, Base):
    __tablename__ = "fee_accounts"
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), unique=True)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fee_plans.id"))


class FeePayment(Stamped, Base):
    __tablename__ = "fee_payments"
    __table_args__ = (UniqueConstraint("idempotency_key"), CheckConstraint("amount > 0"),
                      CheckConstraint("kind = 'simulated'"))
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fee_accounts.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    kind: Mapped[str] = mapped_column(String(12), default="simulated")
    idempotency_key: Mapped[uuid.UUID] = mapped_column(Uuid)
    recorded_by: Mapped[uuid.UUID] = mapped_column(Uuid)


class Receipt(Stamped, Base):
    __tablename__ = "receipts"
    payment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fee_payments.id"), unique=True)
    receipt_number: Mapped[str] = mapped_column(String(30), unique=True)


class RiskAssessment(Stamped, Base):
    __tablename__ = "risk_assessments"
    __table_args__ = (CheckConstraint("category IN ('on_track','watch','at_risk')"),
                      CheckConstraint("confidence IN ('sufficient','limited','insufficient')"),
                      CheckConstraint("explanation_status IN ('pending','available','unavailable')"))
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), index=True)
    category: Mapped[str] = mapped_column(String(12))
    confidence: Mapped[str] = mapped_column(String(14))
    attendance_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    internals_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    internals_max: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    evidence: Mapped[dict] = mapped_column(JSON)
    rule_version: Mapped[str] = mapped_column(String(20))
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_status: Mapped[str] = mapped_column(String(12), default="unavailable")


class MentorTask(Stamped, Base):
    __tablename__ = "mentor_tasks"
    __table_args__ = (CheckConstraint("status IN ('open','in_progress','completed','cancelled')"),)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), index=True)
    assessment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("risk_assessments.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(160))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(12), default="open", index=True)
    due_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    assignee_faculty_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("faculty.id"), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid)


class AuditEvent(Stamped, Base):
    __tablename__ = "audit_events"
    actor_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    action: Mapped[str] = mapped_column(String(60), index=True)
    entity_type: Mapped[str] = mapped_column(String(40), index=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    old_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

"""Attendance sessions and offline sync (docs/phase-2/OFFLINE_SYNC_DESIGN.md, PD-10/11/20/21/33)."""
import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models import (AttendanceRecord, AttendanceSession, Batch, FacultySubjectAssignment, Student, Subject)
from app.services.audit import record_audit

IST = timezone(timedelta(hours=5, minutes=30))
VALID_STATUSES = {"present", "absent", "late"}


@dataclass
class SyncOutcome:
    session: AttendanceSession
    created: bool   # False when the call was an idempotent replay


def today_ist() -> date:
    return datetime.now(IST).date()


def _hash(batch_id, subject_id, held_on, period, records) -> str:
    canon = json.dumps({"b": str(batch_id), "s": str(subject_id), "d": held_on.isoformat(), "p": period,
                        "r": sorted((str(r["student_id"]), r["status"]) for r in records)}, separators=(",", ":"))
    return hashlib.sha256(canon.encode()).hexdigest()


def roster_for(db: Session, user: CurrentUser, batch_id: uuid.UUID, subject_id: uuid.UUID) -> list[Student]:
    batch = db.get(Batch, batch_id)
    if batch is None or batch.campus_id != user.campus_id:
        raise HTTPException(404, "Class not found")
    if user.role == "faculty":
        assigned = db.scalar(select(FacultySubjectAssignment.id).where(
            FacultySubjectAssignment.faculty_id == user.faculty_id,
            FacultySubjectAssignment.subject_id == subject_id, FacultySubjectAssignment.batch_id == batch_id))
        if assigned is None:
            raise HTTPException(403, "You are not assigned to this class")
    return list(db.scalars(select(Student).where(Student.batch_id == batch_id, Student.status == "active",
                                                 Student.campus_id == user.campus_id).order_by(Student.roll_number)))


def sync_session(db: Session, user: CurrentUser, *, idempotency_key: uuid.UUID, batch_id: uuid.UUID,
                 subject_id: uuid.UUID, held_on: date, period: int, records: list[dict]) -> SyncOutcome:
    if user.role != "faculty":
        raise HTTPException(403, "Only assigned faculty can submit attendance")
    if not 1 <= period <= 8:
        raise HTTPException(422, "period must be between 1 and 8")
    if held_on > today_ist():
        raise HTTPException(422, "held_on cannot be in the future")
    if db.get(Subject, subject_id) is None:
        raise HTTPException(404, "Subject not found")

    roster = roster_for(db, user, batch_id, subject_id)  # also enforces assignment (403) and campus (404)
    submitted_ids = [r["student_id"] for r in records]
    if any(r["status"] not in VALID_STATUSES for r in records):
        raise HTTPException(422, "status must be present, absent or late")
    if len(set(submitted_ids)) != len(submitted_ids):
        raise HTTPException(422, "Duplicate student in submission")
    if set(submitted_ids) != {s.id for s in roster}:
        raise HTTPException(422, "Submission must contain exactly one status for every student in the roster")

    h = _hash(batch_id, subject_id, held_on, period, records)

    def existing_by_key():
        return db.scalar(select(AttendanceSession).where(AttendanceSession.idempotency_key == idempotency_key))

    def resolve_existing() -> SyncOutcome:
        by_key = existing_by_key()
        if by_key is not None:
            if by_key.payload_hash == h and by_key.faculty_id == user.faculty_id:
                return SyncOutcome(by_key, False)
            raise HTTPException(409, "idempotency_conflict: this key was already used with a different payload")
        natural = db.scalar(select(AttendanceSession).where(
            AttendanceSession.batch_id == batch_id, AttendanceSession.subject_id == subject_id,
            AttendanceSession.held_on == held_on, AttendanceSession.period == period))
        if natural is not None:
            raise HTTPException(409, "session_conflict: attendance for this class, date and period already exists")
        raise HTTPException(409, "conflict")

    pre = existing_by_key()
    if pre is not None:
        return resolve_existing()

    session = AttendanceSession(idempotency_key=idempotency_key, payload_hash=h, batch_id=batch_id,
                                subject_id=subject_id, faculty_id=user.faculty_id, held_on=held_on, period=period)
    session.records = [AttendanceRecord(student_id=r["student_id"], status=r["status"]) for r in records]
    db.add(session)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return resolve_existing()
    return SyncOutcome(session, True)


def correct_session(db: Session, user: CurrentUser, session_id: uuid.UUID, records: list[dict],
                    reason: str) -> AttendanceSession:
    """Office Admin correction of a synced session. Reason is mandatory; change is audited (PD-20)."""
    if not reason or not reason.strip():
        raise HTTPException(422, "A reason is required for corrections")
    session = db.get(AttendanceSession, session_id)
    batch = db.get(Batch, session.batch_id) if session else None
    if session is None or batch is None or batch.campus_id != user.campus_id:
        raise HTTPException(404, "Session not found")
    by_student = {r.student_id: r for r in session.records}
    old = {str(sid): r.status for sid, r in by_student.items()}
    for r in records:
        if r["status"] not in VALID_STATUSES:
            raise HTTPException(422, "status must be present, absent or late")
        if r["student_id"] not in by_student:
            raise HTTPException(422, "Student is not part of this session")
    for r in records:
        by_student[r["student_id"]].status = r["status"]
    new = {str(sid): r.status for sid, r in by_student.items()}
    record_audit(db, actor_id=user.id, action="attendance.corrected", entity_type="attendance_session",
                 entity_id=session.id, old=old, new=new, reason=reason.strip())
    db.commit()
    return session

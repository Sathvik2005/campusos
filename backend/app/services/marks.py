"""Internal marks lifecycle: draft -> submitted -> moderated -> locked (PD-24/25/26)."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models import (AssessmentComponent, Batch, FacultySubjectAssignment, Mark, MarksAudit, Student)
from app.services.audit import record_audit


def _component(db: Session, user: CurrentUser, component_id: uuid.UUID) -> AssessmentComponent:
    c = db.get(AssessmentComponent, component_id)
    batch = db.get(Batch, c.batch_id) if c else None
    if c is None or batch is None or batch.campus_id != user.campus_id:
        raise HTTPException(404, "Assessment not found")
    if user.role == "faculty" and not _assigned(db, user, c):
        raise HTTPException(404, "Assessment not found")  # out-of-scope objects are not revealed
    return c


def _assigned(db: Session, user: CurrentUser, c: AssessmentComponent) -> bool:
    return db.scalar(select(FacultySubjectAssignment.id).where(
        FacultySubjectAssignment.faculty_id == user.faculty_id, FacultySubjectAssignment.subject_id == c.subject_id,
        FacultySubjectAssignment.batch_id == c.batch_id)) is not None


def get_component(db: Session, user: CurrentUser, component_id: uuid.UUID) -> AssessmentComponent:
    return _component(db, user, component_id)


def create_component(db: Session, user: CurrentUser, *, subject_id, batch_id, name: str, max_marks: Decimal):
    batch = db.get(Batch, batch_id)
    if batch is None or batch.campus_id != user.campus_id:
        raise HTTPException(404, "Batch not found")
    if max_marks <= 0:
        raise HTTPException(422, "max_marks must be greater than 0")
    c = AssessmentComponent(subject_id=subject_id, batch_id=batch_id, name=name.strip(), max_marks=max_marks)
    db.add(c)
    record_audit(db, actor_id=user.id, action="marks.component_created", entity_type="assessment_component",
                 new={"name": c.name, "max_marks": str(max_marks)})
    db.flush()
    db.commit()
    return c


def set_scores(db: Session, user: CurrentUser, component_id: uuid.UUID, scores: list[dict],
               reason: str | None = None) -> AssessmentComponent:
    c = _component(db, user, component_id)
    if c.lifecycle == "locked":
        raise HTTPException(409, "These marks are locked. An Office Admin must unlock them first.")
    if user.role == "faculty" and c.lifecycle != "draft":
        raise HTTPException(409, "Submitted marks are read-only for faculty")
    if user.role == "office_admin" and c.lifecycle == "draft":
        raise HTTPException(409, "Marks are still in draft; the faculty member must submit them first")
    if user.role == "office_admin" and not (reason and reason.strip()):
        raise HTTPException(422, "A reason is required when an Office Admin changes scores")

    valid_ids = set(db.scalars(select(Student.id).where(Student.batch_id == c.batch_id,
                                                         Student.campus_id == user.campus_id)))
    existing = {m.student_id: m for m in db.scalars(select(Mark).where(Mark.component_id == c.id))}
    parsed: list[tuple[uuid.UUID, Decimal]] = []
    for s in scores:
        try:
            score = Decimal(str(s["score"]))
        except (InvalidOperation, KeyError):
            raise HTTPException(422, "score must be a number")
        if not score.is_finite() or score < 0:
            raise HTTPException(422, "score cannot be negative")
        if score > c.max_marks:
            raise HTTPException(422, f"score {score} exceeds the maximum of {c.max_marks}")
        if score != score.quantize(Decimal("0.01")):
            raise HTTPException(422, "score supports at most 2 decimal places")
        if s["student_id"] not in valid_ids:
            raise HTTPException(422, "Student is not part of this class")
        parsed.append((s["student_id"], score))

    for sid, score in parsed:   # all validated; now apply atomically
        m = existing.get(sid)
        old = m.score if m else None
        if m is None:
            db.add(Mark(component_id=c.id, student_id=sid, score=score))
        elif m.score != score:
            m.score = score
        else:
            continue
        db.add(MarksAudit(component_id=c.id, student_id=sid, actor_id=user.id, old_score=old, new_score=score,
                          reason=reason))
    db.commit()
    return c


def _transition(db: Session, user: CurrentUser, c: AssessmentComponent, allowed_from: str, to: str,
                reason: str | None = None) -> AssessmentComponent:
    if c.lifecycle != allowed_from:
        raise HTTPException(409, f"Cannot move from '{c.lifecycle}' to '{to}'")
    old = c.lifecycle
    c.lifecycle = to
    now = datetime.now(timezone.utc)
    if to == "submitted":
        c.submitted_at = now
    if to == "locked":
        c.locked_at, c.locked_by = now, user.id
    if old == "locked":
        c.locked_at = c.locked_by = None
    db.add(MarksAudit(component_id=c.id, actor_id=user.id, from_lifecycle=old, to_lifecycle=to, reason=reason))
    record_audit(db, actor_id=user.id, action=f"marks.{to}", entity_type="assessment_component", entity_id=c.id,
                 old={"lifecycle": old}, new={"lifecycle": to}, reason=reason)
    db.commit()
    return c


def submit(db: Session, user: CurrentUser, component_id: uuid.UUID) -> AssessmentComponent:
    c = _component(db, user, component_id)
    if user.role != "faculty":
        raise HTTPException(403, "Only the assigned faculty member can submit marks")
    roster = set(db.scalars(select(Student.id).where(Student.batch_id == c.batch_id, Student.status == "active")))
    scored = set(db.scalars(select(Mark.student_id).where(Mark.component_id == c.id)))
    if roster - scored:
        raise HTTPException(422, f"{len(roster - scored)} student(s) still have no score")
    return _transition(db, user, c, "draft", "submitted")


def moderate(db, user, component_id):
    return _transition(db, user, _component(db, user, component_id), "submitted", "moderated")


def lock(db, user, component_id):
    return _transition(db, user, _component(db, user, component_id), "moderated", "locked")


def unlock(db, user, component_id, reason: str):
    if not reason or not reason.strip():
        raise HTTPException(422, "A reason is required to unlock marks")
    return _transition(db, user, _component(db, user, component_id), "locked", "moderated", reason.strip())

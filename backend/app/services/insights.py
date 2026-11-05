import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import explainer
from app.core.security import CurrentUser
from app.models import Faculty, MentorTask, RiskAssessment, Student
from app.services import risk, stats
from app.services.audit import record_audit
from app.services.attendance import today_ist


def live_assessment(db: Session, student: Student) -> risk.RiskResult:
    return risk.assess(stats.attendance_pct(db, student.id), stats.internals(db, student.id))


def assess_and_store(db: Session, user: CurrentUser, student_id: uuid.UUID,
                     provider: explainer.ExplanationProvider | None = None) -> RiskAssessment:
    """Rules decide the category; the optional model only explains. The rules result is persisted
    even if the explanation fails. A new row is written each time (history is never overwritten)."""
    student = db.get(Student, student_id)
    if student is None or student.campus_id != user.campus_id:
        raise HTTPException(404, "Student not found")
    result = live_assessment(db, student)
    payload = explainer.build_payload(result.category, result.confidence, result.indicators, result.evidence)
    status, text, reason = explainer.explain(payload, provider)
    ev = dict(result.evidence)
    ev["indicators"] = result.indicators
    ev["explanation_unavailable_reason"] = reason
    row = RiskAssessment(
        student_id=student.id, category=result.category, confidence=result.confidence,
        attendance_pct=ev["attendance_pct"], internals_score=ev["internals_score"], internals_max=ev["internals_max"],
        evidence=ev, rule_version=result.rule_version, explanation=text, explanation_status=status)
    db.add(row)
    db.flush()
    record_audit(db, actor_id=user.id, action="insights.assessed", entity_type="risk_assessment", entity_id=row.id,
                 new={"category": row.category, "rule_version": row.rule_version, "explanation": status})
    db.commit()
    return row


def at_risk_overview(db: Session, user: CurrentUser) -> list[dict]:
    out = []
    for s in db.scalars(select(Student).where(Student.campus_id == user.campus_id, Student.status == "active")
                        .order_by(Student.roll_number)):
        r = live_assessment(db, s)
        if r.category != "on_track" or r.confidence == "insufficient":
            out.append({"student": s, "result": r})
    return out


VALID_NEXT = {"open": {"in_progress", "cancelled"}, "in_progress": {"completed", "cancelled"},
              "completed": set(), "cancelled": set()}


def create_task(db: Session, user: CurrentUser, *, student_id, title: str, notes, due_on: date | None,
                assignee_faculty_id, assessment_id=None) -> MentorTask:
    student = db.get(Student, student_id)
    if student is None or student.campus_id != user.campus_id:
        raise HTTPException(404, "Student not found")
    if due_on is not None and due_on < today_ist():
        raise HTTPException(422, "due_on cannot be in the past")
    if assignee_faculty_id is not None:
        f = db.get(Faculty, assignee_faculty_id)
        if f is None or f.campus_id != user.campus_id or not f.is_active:
            raise HTTPException(422, "Assignee must be an active faculty member of this campus")
    if assessment_id is not None:
        a = db.get(RiskAssessment, assessment_id)
        if a is None or a.student_id != student_id:
            raise HTTPException(422, "assessment does not belong to this student")
    t = MentorTask(student_id=student_id, assessment_id=assessment_id, title=title.strip(), notes=notes,
                   due_on=due_on, assignee_faculty_id=assignee_faculty_id, created_by=user.id)
    db.add(t)
    db.flush()
    record_audit(db, actor_id=user.id, action="mentor_task.created", entity_type="mentor_task", entity_id=t.id,
                 new={"student_id": str(student_id), "title": t.title, "due_on": str(due_on)})
    db.commit()
    return t


def update_task_status(db: Session, user: CurrentUser, task_id: uuid.UUID, status: str,
                       reason: str | None) -> MentorTask:
    t = db.get(MentorTask, task_id)
    s = db.get(Student, t.student_id) if t else None
    if t is None or s is None or s.campus_id != user.campus_id:
        raise HTTPException(404, "Task not found")
    if status not in VALID_NEXT.get(t.status, set()):
        raise HTTPException(409, f"Cannot move task from '{t.status}' to '{status}'")
    if status == "cancelled" and not (reason and reason.strip()):
        raise HTTPException(422, "A reason is required to cancel a task")
    old = t.status
    t.status = status
    record_audit(db, actor_id=user.id, action="mentor_task.status_changed", entity_type="mentor_task",
                 entity_id=t.id, old={"status": old}, new={"status": status}, reason=reason)
    db.commit()
    return t

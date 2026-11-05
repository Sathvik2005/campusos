from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_current_user, get_db, require_admin
from app.models import (AttendanceSession, AuditEvent, FacultySubjectAssignment, FeeAccount, FeePayment, MentorTask,
                        Student)
from app.schemas import api as s
from app.services import insights as insight_svc
from app.services import stats

router = APIRouter(tags=["audit"])


@router.get("/audit", response_model=s.AuditList)
def audit(entity_type: str | None = Query(default=None, max_length=40), action: str | None = Query(default=None, max_length=60),
          page: int = Query(default=1, ge=1), page_size: int = Query(default=25, ge=1, le=100),
          db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    """Read-only. There is deliberately no write/update/delete endpoint for audit events."""
    q = select(AuditEvent)
    if entity_type:
        q = q.where(AuditEvent.entity_type == entity_type)
    if action:
        q = q.where(AuditEvent.action == action)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    items = db.scalars(q.order_by(AuditEvent.created_at.desc()).limit(page_size).offset((page - 1) * page_size)).all()
    return s.AuditList(total=total, page=page, page_size=page_size, items=items)


@router.get("/overview")
def overview(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    """Role-shaped aggregates computed from real rows. Faculty get their own classes only; no fee data."""
    if user.role == "faculty":
        classes = db.scalar(select(func.count()).select_from(FacultySubjectAssignment)
                            .where(FacultySubjectAssignment.faculty_id == user.faculty_id))
        sessions = db.scalar(select(func.count()).select_from(AttendanceSession)
                             .where(AttendanceSession.faculty_id == user.faculty_id))
        return {"role": "faculty", "assigned_classes": classes, "sessions_recorded": sessions}
    students = db.scalar(select(func.count()).select_from(Student)
                         .where(Student.campus_id == user.campus_id, Student.status == "active"))
    flagged = insight_svc.at_risk_overview(db, user)
    below_75 = sum(1 for f in flagged if any(i["code"] in ("attendance_shortage", "attendance_severe")
                                             for i in f["result"].indicators))
    accounts = db.execute(select(FeeAccount.id, FeeAccount.student_id)).all()
    outstanding = sum((stats.fee_summary(db, sid)["outstanding"] for _, sid in accounts), start=stats.q2(stats.Decimal(0)))
    open_tasks = db.scalar(select(func.count()).select_from(MentorTask).where(MentorTask.status.in_(("open", "in_progress"))))
    return {"role": "office_admin", "active_students": students, "students_below_75_attendance": below_75,
            "students_to_review": len(flagged), "outstanding_dues": str(outstanding),
            "open_mentor_tasks": open_tasks}

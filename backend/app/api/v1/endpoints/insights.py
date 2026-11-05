import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import explainer
from app.core.security import CurrentUser, get_db, require_admin
from app.models import MentorTask, RiskAssessment, Student
from app.schemas import api as s
from app.services import insights as svc
from app.services import stats

router = APIRouter(tags=["insights"])   # Office Admin only


def _provider():
    return explainer.get_provider()


def _row_out(a: RiskAssessment) -> s.AssessmentOut:
    note = {"available": "AI-generated explanation, based only on the evidence shown.",
            "unavailable": "AI explanation unavailable. The rule-based assessment above is unaffected.",
            "pending": "Explanation pending."}[a.explanation_status]
    return s.AssessmentOut(
        id=a.id, student_id=a.student_id, category=a.category, confidence=a.confidence,
        indicators=a.evidence.get("indicators", []), attendance_pct=a.attendance_pct, internals_score=a.internals_score,
        internals_max=a.internals_max, rule_version=a.rule_version, explanation=a.explanation,
        explanation_status=a.explanation_status, explanation_note=note, persisted=True, created_at=a.created_at)


@router.get("/insights/at-risk", response_model=list[s.AtRiskRow])
def at_risk(db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    """Live, rule-based overview (computed now from official data; no AI involved)."""
    rows = []
    for item in svc.at_risk_overview(db, user):
        st, r = item["student"], item["result"]
        ev = r.evidence
        rows.append(s.AtRiskRow(student_id=st.id, roll_number=st.roll_number, full_name=st.full_name,
                                category=r.category, confidence=r.confidence, indicators=r.indicators,
                                attendance_pct=ev["attendance_pct"], internals_score=ev["internals_score"],
                                internals_max=ev["internals_max"], rule_version=r.rule_version))
    return rows


@router.get("/insights/students/{student_id}", response_model=s.AssessmentOut)
def latest(student_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    st = db.get(Student, student_id)
    if st is None or st.campus_id != user.campus_id:
        raise HTTPException(404, "Student not found")
    a = db.scalar(select(RiskAssessment).where(RiskAssessment.student_id == student_id)
                  .order_by(RiskAssessment.created_at.desc()))
    if a is not None:
        return _row_out(a)
    r = svc.live_assessment(db, st)   # not yet stored: show live rules, clearly marked as not persisted
    ev = r.evidence
    return s.AssessmentOut(student_id=st.id, category=r.category, confidence=r.confidence, indicators=r.indicators,
                           attendance_pct=ev["attendance_pct"], internals_score=ev["internals_score"],
                           internals_max=ev["internals_max"], rule_version=r.rule_version)


@router.post("/insights/students/{student_id}/assess", response_model=s.AssessmentOut, status_code=201)
def assess(student_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin),
           provider=Depends(_provider)):
    """Recompute rules, store a new history row, and try an optional AI explanation (fails closed)."""
    return _row_out(svc.assess_and_store(db, user, student_id, provider))


@router.get("/insights/students/{student_id}/history", response_model=list[s.AssessmentOut])
def history(student_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    st = db.get(Student, student_id)
    if st is None or st.campus_id != user.campus_id:
        raise HTTPException(404, "Student not found")
    rows = db.scalars(select(RiskAssessment).where(RiskAssessment.student_id == student_id)
                      .order_by(RiskAssessment.created_at.desc()).limit(50)).all()
    return [_row_out(a) for a in rows]


@router.get("/mentor-tasks", response_model=list[s.TaskOut])
def list_tasks(status: str | None = Query(default=None, pattern="^(open|in_progress|completed|cancelled)$"),
               student_id: uuid.UUID | None = None, db: Session = Depends(get_db),
               user: CurrentUser = Depends(require_admin)):
    q = select(MentorTask).join(Student, Student.id == MentorTask.student_id).where(Student.campus_id == user.campus_id)
    if status:
        q = q.where(MentorTask.status == status)
    if student_id:
        q = q.where(MentorTask.student_id == student_id)
    return db.scalars(q.order_by(MentorTask.created_at.desc()).limit(200)).all()


@router.post("/mentor-tasks", response_model=s.TaskOut, status_code=201)
def create_task(body: s.TaskIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    """Explicit Office Admin action only; nothing creates tasks automatically (PD-14)."""
    return svc.create_task(db, user, student_id=body.student_id, title=body.title, notes=body.notes,
                           due_on=body.due_on, assignee_faculty_id=body.assignee_faculty_id,
                           assessment_id=body.assessment_id)


@router.patch("/mentor-tasks/{task_id}", response_model=s.TaskOut)
def update_task(task_id: uuid.UUID, body: s.TaskStatusIn, db: Session = Depends(get_db),
                user: CurrentUser = Depends(require_admin)):
    return svc.update_task_status(db, user, task_id, body.status, body.reason)

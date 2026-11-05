import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_current_user, get_db, require_admin
from app.models import AssessmentComponent, Batch, FacultySubjectAssignment, Mark, MarksAudit
from app.schemas import api as s
from app.services import marks as svc

router = APIRouter(prefix="/marks", tags=["marks"])


@router.get("/assessments", response_model=list[s.ComponentOut])
def list_components(batch_id: uuid.UUID | None = None, subject_id: uuid.UUID | None = None,
                    db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    q = select(AssessmentComponent).join(Batch, Batch.id == AssessmentComponent.batch_id) \
        .where(Batch.campus_id == user.campus_id)
    if user.role == "faculty":
        assigned = select(FacultySubjectAssignment.subject_id, FacultySubjectAssignment.batch_id) \
            .where(FacultySubjectAssignment.faculty_id == user.faculty_id).subquery()
        q = q.join(assigned, (assigned.c.subject_id == AssessmentComponent.subject_id)
                   & (assigned.c.batch_id == AssessmentComponent.batch_id))
    if batch_id:
        q = q.where(AssessmentComponent.batch_id == batch_id)
    if subject_id:
        q = q.where(AssessmentComponent.subject_id == subject_id)
    return db.scalars(q.order_by(AssessmentComponent.name)).all()


@router.post("/assessments", response_model=s.ComponentOut, status_code=201)
def create_component(body: s.ComponentIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    try:
        return svc.create_component(db, user, subject_id=body.subject_id, batch_id=body.batch_id, name=body.name,
                                    max_marks=body.max_marks)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This assessment already exists for the class")


@router.get("/assessments/{component_id}", response_model=s.ComponentDetail)
def get_component(component_id: uuid.UUID, db: Session = Depends(get_db),
                  user: CurrentUser = Depends(get_current_user)):
    c = svc.get_component(db, user, component_id)
    scores = db.scalars(select(Mark).where(Mark.component_id == c.id)).all()
    return s.ComponentDetail(**s.ComponentOut.model_validate(c).model_dump(),
                             scores=[s.ScoreOut.model_validate(m) for m in scores])


@router.put("/assessments/{component_id}/scores", response_model=s.ComponentOut)
def put_scores(component_id: uuid.UUID, body: s.ScoresIn, db: Session = Depends(get_db),
               user: CurrentUser = Depends(get_current_user)):
    return svc.set_scores(db, user, component_id, [x.model_dump() for x in body.scores], body.reason)


@router.post("/assessments/{component_id}/submit", response_model=s.ComponentOut)
def submit(component_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return svc.submit(db, user, component_id)


@router.post("/moderation/{component_id}/moderate", response_model=s.ComponentOut)
def moderate(component_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return svc.moderate(db, user, component_id)


@router.post("/moderation/{component_id}/lock", response_model=s.ComponentOut)
def lock(component_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return svc.lock(db, user, component_id)


@router.post("/moderation/{component_id}/unlock", response_model=s.ComponentOut)
def unlock(component_id: uuid.UUID, body: s.ReasonIn, db: Session = Depends(get_db),
           user: CurrentUser = Depends(require_admin)):
    return svc.unlock(db, user, component_id, body.reason)


@router.get("/assessments/{component_id}/audit", response_model=list[s.MarksAuditOut])
def audit(component_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    c = svc.get_component(db, user, component_id)
    return db.scalars(select(MarksAudit).where(MarksAudit.component_id == c.id).order_by(MarksAudit.created_at)).all()

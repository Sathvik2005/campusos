import uuid
from datetime import date

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_current_user, get_db, require_admin, require_faculty
from app.models import AttendanceSession, Batch
from app.schemas import api as s
from app.services import attendance as svc

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/roster", response_model=s.RosterOut)
def roster(batch_id: uuid.UUID, subject_id: uuid.UUID, db: Session = Depends(get_db),
           user: CurrentUser = Depends(get_current_user)):
    students = svc.roster_for(db, user, batch_id, subject_id)
    return s.RosterOut(batch_id=batch_id, subject_id=subject_id, students=students)


@router.get("/sessions", response_model=list[s.SessionOut])
def list_sessions(batch_id: uuid.UUID | None = None, subject_id: uuid.UUID | None = None,
                  held_on: date | None = None, db: Session = Depends(get_db),
                  user: CurrentUser = Depends(get_current_user)):
    q = select(AttendanceSession).join(Batch, Batch.id == AttendanceSession.batch_id) \
        .where(Batch.campus_id == user.campus_id)
    if user.role == "faculty":
        q = q.where(AttendanceSession.faculty_id == user.faculty_id)
    if batch_id:
        q = q.where(AttendanceSession.batch_id == batch_id)
    if subject_id:
        q = q.where(AttendanceSession.subject_id == subject_id)
    if held_on:
        q = q.where(AttendanceSession.held_on == held_on)
    return db.scalars(q.order_by(AttendanceSession.held_on.desc(), AttendanceSession.period).limit(200)).all()


def _do_sync(body: s.SyncIn, response: Response, db: Session, user: CurrentUser) -> s.SyncOut:
    out = svc.sync_session(db, user, idempotency_key=body.idempotency_key, batch_id=body.batch_id,
                           subject_id=body.subject_id, held_on=body.held_on, period=body.period,
                           records=[r.model_dump() for r in body.records])
    response.status_code = 201 if out.created else 200   # replay is a successful no-op, not a duplicate
    return s.SyncOut(session_id=out.session.id, created=out.created, record_count=len(out.session.records))


@router.post("/sync", response_model=s.SyncOut)
def sync(body: s.SyncIn, response: Response, db: Session = Depends(get_db),
         user: CurrentUser = Depends(require_faculty)):
    """Offline outbox target. Same idempotency key + same payload -> 200 (existing); different payload -> 409."""
    return _do_sync(body, response, db, user)


@router.post("/sessions", response_model=s.SyncOut)
def create_session(body: s.SyncIn, response: Response, db: Session = Depends(get_db),
                   user: CurrentUser = Depends(require_faculty)):
    """Online save; identical validation and idempotency to /sync."""
    return _do_sync(body, response, db, user)


@router.put("/sessions/{session_id}/correction", response_model=s.SessionOut)
def correct(session_id: uuid.UUID, body: s.CorrectionIn, db: Session = Depends(get_db),
            user: CurrentUser = Depends(require_admin)):
    return svc.correct_session(db, user, session_id, [r.model_dump() for r in body.records], body.reason)

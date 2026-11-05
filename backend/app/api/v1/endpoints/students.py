import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_current_user, get_db, require_admin
from app.models import Batch, FacultySubjectAssignment, Student
from app.schemas import api as s
from app.services import stats
from app.services.audit import record_audit

router = APIRouter(prefix="/students", tags=["students"])


def _visible(db: Session, user: CurrentUser):
    q = select(Student).where(Student.campus_id == user.campus_id)
    if user.role == "faculty":
        q = q.where(Student.batch_id.in_(select(FacultySubjectAssignment.batch_id)
                                         .where(FacultySubjectAssignment.faculty_id == user.faculty_id)))
    return q


@router.get("", response_model=s.StudentList)
def list_students(q: str | None = Query(default=None, max_length=80), batch_id: uuid.UUID | None = None,
                  status: str | None = Query(default=None, pattern="^(active|inactive)$"),
                  page: int = Query(default=1, ge=1), page_size: int = Query(default=25, ge=1, le=100),
                  db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    base = _visible(db, user)
    if q:
        like = f"%{q.strip().lower()}%"
        base = base.where(or_(func.lower(Student.full_name).like(like), func.lower(Student.roll_number).like(like)))
    if batch_id:
        base = base.where(Student.batch_id == batch_id)
    if status:
        base = base.where(Student.status == status)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.scalars(base.order_by(Student.roll_number).limit(page_size).offset((page - 1) * page_size)).all()
    return s.StudentList(total=total, page=page, page_size=page_size, items=items)


@router.get("/{student_id}", response_model=s.StudentDetail)
def get_student(student_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    st = db.scalar(_visible(db, user).where(Student.id == student_id))
    if st is None:
        raise HTTPException(404, "Student not found")   # same answer for out-of-scope ids (no IDOR signal)
    att = stats.attendance_pct(db, st.id)
    ints = stats.internals(db, st.id)
    fees = None
    if user.is_admin:
        fs = stats.fee_summary(db, st.id)
        fees = s.FeeSummaryOut(total=fs["total"], paid=fs["paid"], outstanding=fs["outstanding"]) if fs else None
    return s.StudentDetail(**s.StudentRow.model_validate(st).model_dump(), attendance_pct=att,
                           internals_score=ints[0] if ints else None, internals_max=ints[1] if ints else None,
                           fees=fees)


@router.post("", response_model=s.StudentRow, status_code=201)
def create_student(body: s.StudentIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    batch = db.get(Batch, body.batch_id)
    if batch is None or batch.campus_id != user.campus_id:
        raise HTTPException(422, "Batch not found in this campus")
    st = Student(campus_id=user.campus_id, batch_id=batch.id, roll_number=body.roll_number,
                 full_name=body.full_name, year_of_study=batch.year_of_study)
    db.add(st)
    try:
        db.flush()
        record_audit(db, actor_id=user.id, action="student.created", entity_type="student", entity_id=st.id,
                     new={"roll_number": st.roll_number})
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A student with this roll number already exists")
    return st


@router.patch("/{student_id}", response_model=s.StudentRow)
def update_student(student_id: uuid.UUID, body: s.StudentUpdate, db: Session = Depends(get_db),
                   user: CurrentUser = Depends(require_admin)):
    st = db.get(Student, student_id)
    if st is None or st.campus_id != user.campus_id:
        raise HTTPException(404, "Student not found")
    changes = body.model_dump(exclude_none=True)
    old = {k: getattr(st, k) for k in changes}
    for k, v in changes.items():
        setattr(st, k, v)
    record_audit(db, actor_id=user.id, action="student.updated", entity_type="student", entity_id=st.id,
                 old=old, new=changes)
    db.commit()
    return st

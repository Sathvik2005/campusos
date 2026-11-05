"""Academic masters. Writes: Office Admin only. Reads: Admin sees the campus; Faculty only what they are assigned."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_current_user, get_db, require_admin
from app.models import (AcademicYear, Batch, Faculty, FacultySubjectAssignment, Programme, Subject)
from app.schemas import api as s
from app.services.audit import record_audit

router = APIRouter(prefix="/academic", tags=["academic"])


def _save(db: Session, obj, user: CurrentUser, action: str, entity: str, new: dict):
    db.add(obj)
    try:
        db.flush()
        record_audit(db, actor_id=user.id, action=action, entity_type=entity, entity_id=obj.id, new=new)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A record with these values already exists or references something invalid")
    return obj


def _scoped_ids(db: Session, user: CurrentUser, col):
    return set(db.scalars(select(col).where(FacultySubjectAssignment.faculty_id == user.faculty_id)))


# ---- programmes
@router.get("/programmes", response_model=list[s.ProgrammeOut])
def list_programmes(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return db.scalars(select(Programme).where(Programme.campus_id == user.campus_id).order_by(Programme.code)).all()


@router.post("/programmes", response_model=s.ProgrammeOut, status_code=201)
def create_programme(body: s.ProgrammeIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return _save(db, Programme(campus_id=user.campus_id, **body.model_dump()), user, "academic.programme_created",
                 "programme", body.model_dump())


# ---- academic years
@router.get("/academic-years", response_model=list[s.AcademicYearOut])
def list_years(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return db.scalars(select(AcademicYear).where(AcademicYear.campus_id == user.campus_id)
                      .order_by(AcademicYear.starts_on.desc())).all()


@router.post("/academic-years", response_model=s.AcademicYearOut, status_code=201)
def create_year(body: s.AcademicYearIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    if body.ends_on <= body.starts_on:
        raise HTTPException(422, "ends_on must be after starts_on")
    return _save(db, AcademicYear(campus_id=user.campus_id, **body.model_dump()), user,
                 "academic.year_created", "academic_year", body.model_dump(mode="json"))


# ---- batches
@router.get("/batches", response_model=list[s.BatchOut])
def list_batches(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    q = select(Batch).where(Batch.campus_id == user.campus_id)
    if user.role == "faculty":
        q = q.where(Batch.id.in_(_scoped_ids(db, user, FacultySubjectAssignment.batch_id)))
    return db.scalars(q.order_by(Batch.year_of_study, Batch.section)).all()


@router.post("/batches", response_model=s.BatchOut, status_code=201)
def create_batch(body: s.BatchIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    prog = db.get(Programme, body.programme_id)
    year = db.get(AcademicYear, body.academic_year_id)
    if not prog or prog.campus_id != user.campus_id or not year or year.campus_id != user.campus_id:
        raise HTTPException(422, "Programme or academic year not found in this campus")
    return _save(db, Batch(campus_id=user.campus_id, **body.model_dump()), user, "academic.batch_created", "batch",
                 body.model_dump(mode="json"))


@router.patch("/batches/{batch_id}", response_model=s.BatchOut)
def set_batch_active(batch_id: uuid.UUID, body: s.ActiveIn, db: Session = Depends(get_db),
                     user: CurrentUser = Depends(require_admin)):
    b = db.get(Batch, batch_id)
    if not b or b.campus_id != user.campus_id:
        raise HTTPException(404, "Batch not found")
    b.is_active = body.is_active
    record_audit(db, actor_id=user.id, action="academic.batch_active_changed", entity_type="batch",
                 entity_id=b.id, new={"is_active": body.is_active})
    db.commit()
    return b


# ---- subjects
@router.get("/subjects", response_model=list[s.SubjectOut])
def list_subjects(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    q = select(Subject).join(Programme, Programme.id == Subject.programme_id).where(Programme.campus_id == user.campus_id)
    if user.role == "faculty":
        q = q.where(Subject.id.in_(_scoped_ids(db, user, FacultySubjectAssignment.subject_id)))
    return db.scalars(q.order_by(Subject.code)).all()


@router.post("/subjects", response_model=s.SubjectOut, status_code=201)
def create_subject(body: s.SubjectIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    prog = db.get(Programme, body.programme_id)
    if not prog or prog.campus_id != user.campus_id:
        raise HTTPException(422, "Programme not found in this campus")
    return _save(db, Subject(**body.model_dump()), user, "academic.subject_created", "subject",
                 body.model_dump(mode="json"))


@router.patch("/subjects/{subject_id}", response_model=s.SubjectOut)
def set_subject_active(subject_id: uuid.UUID, body: s.ActiveIn, db: Session = Depends(get_db),
                       user: CurrentUser = Depends(require_admin)):
    sub = db.get(Subject, subject_id)
    prog = db.get(Programme, sub.programme_id) if sub else None
    if not sub or not prog or prog.campus_id != user.campus_id:
        raise HTTPException(404, "Subject not found")
    sub.is_active = body.is_active
    record_audit(db, actor_id=user.id, action="academic.subject_active_changed", entity_type="subject",
                 entity_id=sub.id, new={"is_active": body.is_active})
    db.commit()
    return sub


# ---- faculty (Admin only)
@router.get("/faculty", response_model=list[s.FacultyOut])
def list_faculty(db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return db.scalars(select(Faculty).where(Faculty.campus_id == user.campus_id).order_by(Faculty.full_name)).all()


@router.post("/faculty", response_model=s.FacultyOut, status_code=201)
def create_faculty(body: s.FacultyIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    return _save(db, Faculty(campus_id=user.campus_id, **body.model_dump()), user, "academic.faculty_created",
                 "faculty", {"employee_code": body.employee_code})


# ---- assignments
@router.get("/assignments", response_model=list[s.AssignmentOut])
def list_assignments(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    q = select(FacultySubjectAssignment).join(Faculty, Faculty.id == FacultySubjectAssignment.faculty_id) \
        .where(Faculty.campus_id == user.campus_id)
    if user.role == "faculty":
        q = q.where(FacultySubjectAssignment.faculty_id == user.faculty_id)
    return db.scalars(q).all()


@router.post("/assignments", response_model=s.AssignmentOut, status_code=201)
def create_assignment(body: s.AssignmentIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    f, b, sub = db.get(Faculty, body.faculty_id), db.get(Batch, body.batch_id), db.get(Subject, body.subject_id)
    if not f or f.campus_id != user.campus_id or not b or b.campus_id != user.campus_id or not sub:
        raise HTTPException(422, "Faculty, batch or subject not found in this campus")
    return _save(db, FacultySubjectAssignment(**body.model_dump()), user, "academic.assignment_created",
                 "assignment", body.model_dump(mode="json"))


@router.delete("/assignments/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: uuid.UUID, db: Session = Depends(get_db),
                      user: CurrentUser = Depends(require_admin)):
    a = db.get(FacultySubjectAssignment, assignment_id)
    f = db.get(Faculty, a.faculty_id) if a else None
    if not a or not f or f.campus_id != user.campus_id:
        raise HTTPException(404, "Assignment not found")
    record_audit(db, actor_id=user.id, action="academic.assignment_removed", entity_type="assignment",
                 entity_id=a.id, old={"faculty_id": str(a.faculty_id), "subject_id": str(a.subject_id),
                                      "batch_id": str(a.batch_id)})
    db.delete(a)
    db.commit()

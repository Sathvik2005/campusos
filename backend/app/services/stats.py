"""Official, server-side numbers (PD-03, PD-31). Pending offline records never count."""
import uuid
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import (AssessmentComponent, AttendanceRecord, FeeAccount, FeePayment, FeePlan, Mark)

OFFICIAL_LIFECYCLES = ("moderated", "locked")
TWO = Decimal("0.01")


def q2(v: Decimal) -> Decimal:
    return v.quantize(TWO, rounding=ROUND_HALF_UP)


def attendance_pct(db: Session, student_id: uuid.UUID) -> Decimal | None:
    """(Present + Late) / (Present + Late + Absent) x 100, one decimal; None when no records."""
    total, attended = db.execute(
        select(func.count(AttendanceRecord.id),
               func.coalesce(func.sum(case((AttendanceRecord.status == "absent", 0), else_=1)), 0))
        .where(AttendanceRecord.student_id == student_id)).one()
    if not total:
        return None
    return (Decimal(attended) * 100 / Decimal(total)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def internals(db: Session, student_id: uuid.UUID) -> tuple[Decimal, Decimal] | None:
    """Sum of scores and maxima over moderated/locked components the student has a score in."""
    row = db.execute(
        select(func.sum(Mark.score), func.sum(AssessmentComponent.max_marks))
        .join(AssessmentComponent, AssessmentComponent.id == Mark.component_id)
        .where(Mark.student_id == student_id, AssessmentComponent.lifecycle.in_(OFFICIAL_LIFECYCLES))).one()
    if row[0] is None:
        return None
    return Decimal(row[0]), Decimal(row[1])


def fee_summary(db: Session, student_id: uuid.UUID) -> dict | None:
    acct = db.scalar(select(FeeAccount).where(FeeAccount.student_id == student_id))
    if acct is None:
        return None
    total = db.scalar(select(FeePlan.total_amount).where(FeePlan.id == acct.plan_id))
    paid = db.scalar(select(func.coalesce(func.sum(FeePayment.amount), 0)).where(FeePayment.account_id == acct.id))
    total, paid = Decimal(total), Decimal(paid)
    return {"account_id": acct.id, "total": q2(total), "paid": q2(paid), "outstanding": q2(total - paid)}

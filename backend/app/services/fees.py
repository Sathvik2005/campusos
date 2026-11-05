"""Simulated fee payments (PD-08/09/27/28). No real money moves; every payment is kind=simulated."""
import secrets
import uuid
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import CurrentUser
from app.models import FeeAccount, FeePayment, Receipt, Student
from app.services.audit import record_audit
from app.services.stats import fee_summary, q2


def _student(db: Session, user: CurrentUser, student_id: uuid.UUID) -> Student:
    s = db.get(Student, student_id)
    if s is None or s.campus_id != user.campus_id:
        raise HTTPException(404, "Student not found")
    return s


def record_payment(db: Session, user: CurrentUser, *, student_id: uuid.UUID, amount: Decimal,
                   idempotency_key: uuid.UUID) -> tuple[FeePayment, Receipt, bool]:
    """Returns (payment, receipt, created). Replaying the same key returns the original, never a second debit."""
    _student(db, user, student_id)
    acct = db.scalar(select(FeeAccount).where(FeeAccount.student_id == student_id))
    if acct is None:
        raise HTTPException(404, "No fee account for this student")

    prior = db.scalar(select(FeePayment).where(FeePayment.idempotency_key == idempotency_key))
    if prior is not None:
        if prior.account_id != acct.id or prior.amount != q2(amount):
            raise HTTPException(409, "idempotency_conflict: this key was already used for a different payment")
        return prior, db.scalar(select(Receipt).where(Receipt.payment_id == prior.id)), False

    if not amount.is_finite() or amount <= 0:
        raise HTTPException(422, "amount must be greater than 0")
    if amount != q2(amount):
        raise HTTPException(422, "amount supports at most 2 decimal places")
    summary = fee_summary(db, student_id)
    if amount > summary["outstanding"]:
        raise HTTPException(422, f"amount exceeds the outstanding balance of {summary['outstanding']}")

    payment = FeePayment(account_id=acct.id, amount=q2(amount), kind="simulated", idempotency_key=idempotency_key,
                         recorded_by=user.id)
    db.add(payment)
    try:
        db.flush()
        receipt = Receipt(payment_id=payment.id, receipt_number=f"DEMO-{secrets.token_hex(4).upper()}")
        db.add(receipt)
        record_audit(db, actor_id=user.id, action="fees.payment_recorded", entity_type="fee_payment",
                     entity_id=payment.id, new={"amount": str(payment.amount), "kind": "simulated"})
        db.commit()
    except IntegrityError:
        db.rollback()
        prior = db.scalar(select(FeePayment).where(FeePayment.idempotency_key == idempotency_key))
        if prior is None:
            raise HTTPException(409, "Payment could not be recorded")
        return prior, db.scalar(select(Receipt).where(Receipt.payment_id == prior.id)), False
    return payment, receipt, True

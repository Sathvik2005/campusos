import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_db, require_admin
from app.models import FeeAccount, FeePayment, Receipt, Student
from app.schemas import api as s
from app.services import fees as svc
from app.services.stats import fee_summary

router = APIRouter(prefix="/fees", tags=["fees"])   # Office Admin only (faculty never see fees)


def _receipt_out(payment: FeePayment, receipt: Receipt) -> s.ReceiptOut:
    return s.ReceiptOut(receipt_number=receipt.receipt_number, amount=payment.amount, kind=payment.kind,
                        created_at=payment.created_at)


@router.get("/accounts", response_model=list[s.FeeAccountOut])
def accounts(q: str | None = Query(default=None, max_length=80), page: int = Query(default=1, ge=1),
             page_size: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db),
             user: CurrentUser = Depends(require_admin)):
    base = select(Student).join(FeeAccount, FeeAccount.student_id == Student.id).where(Student.campus_id == user.campus_id)
    if q:
        like = f"%{q.strip().lower()}%"
        base = base.where(or_(func.lower(Student.full_name).like(like), func.lower(Student.roll_number).like(like)))
    rows = db.scalars(base.order_by(Student.roll_number).limit(page_size).offset((page - 1) * page_size)).all()
    out = []
    for st in rows:
        fs = fee_summary(db, st.id)
        out.append(s.FeeAccountOut(student_id=st.id, roll_number=st.roll_number, full_name=st.full_name,
                                   total=fs["total"], paid=fs["paid"], outstanding=fs["outstanding"]))
    return out


@router.get("/accounts/{student_id}", response_model=s.AccountDetail)
def account(student_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    st = db.get(Student, student_id)
    fs = fee_summary(db, student_id) if st and st.campus_id == user.campus_id else None
    if fs is None:
        raise HTTPException(404, "Fee account not found")
    pays = db.scalars(select(FeePayment).where(FeePayment.account_id == fs["account_id"])
                      .order_by(FeePayment.created_at.desc())).all()
    return s.AccountDetail(student_id=st.id, roll_number=st.roll_number, full_name=st.full_name, total=fs["total"],
                           paid=fs["paid"], outstanding=fs["outstanding"],
                           payments=[s.PaymentOut.model_validate(p) for p in pays])


@router.post("/payments", response_model=s.PaymentResult)
def pay(body: s.PaymentIn, response: Response, db: Session = Depends(get_db),
        user: CurrentUser = Depends(require_admin)):
    """Simulated payment. Replaying the same idempotency_key returns the original (200), never a second debit."""
    payment, receipt, created = svc.record_payment(db, user, student_id=body.student_id, amount=body.amount,
                                                   idempotency_key=body.idempotency_key)
    response.status_code = 201 if created else 200
    return s.PaymentResult(payment=s.PaymentOut.model_validate(payment), receipt=_receipt_out(payment, receipt),
                           created=created, outstanding=fee_summary(db, body.student_id)["outstanding"])


@router.get("/receipts/{payment_id}", response_model=s.ReceiptOut)
def receipt(payment_id: uuid.UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(require_admin)):
    p = db.get(FeePayment, payment_id)
    acct = db.get(FeeAccount, p.account_id) if p else None
    st = db.get(Student, acct.student_id) if acct else None
    r = db.scalar(select(Receipt).where(Receipt.payment_id == payment_id)) if p else None
    if not r or not st or st.campus_id != user.campus_id:
        raise HTTPException(404, "Receipt not found")
    return _receipt_out(p, r)

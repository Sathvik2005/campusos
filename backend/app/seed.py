"""Synthetic demo data (docs/phase-1/PRODUCT_DECISIONS.md PD-15/16). DEV ONLY.

CLI guard rails: refuses when APP_ENV=production, refuses when the database already has students,
and requires an explicit flag. Never run this against a database holding real data.
Includes the exact client sample record: Subhashree Mohanty, ENG-24-CSE-0412, Year 2,
attendance 81.5% (163/200), internals 33/40, fee due 0.00.
"""
import hashlib
import random
import sys
import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (AcademicYear, AssessmentComponent, AttendanceRecord, AttendanceSession, Batch, Campus, Faculty,
                        FacultySubjectAssignment, FeeAccount, FeePayment, FeePlan, Mark, Profile, Programme, Receipt,
                        Student, Subject)
from app.services.attendance import today_ist

SAMPLE_ROLL = "ENG-24-CSE-0412"
FIRST = ["Aarav", "Ishita", "Rohan", "Ananya", "Vivek", "Priya", "Kunal", "Sneha", "Arjun", "Meera", "Dev", "Tanvi",
         "Harsh", "Nisha", "Om", "Riya", "Sahil", "Diya", "Yash", "Kavya"]
LAST = ["Das", "Patra", "Sahu", "Nayak", "Behera", "Mishra", "Panda", "Rout", "Swain", "Jena"]
SUBJECTS = [("CSE201", "Data Structures"), ("CSE202", "Discrete Mathematics"), ("CSE203", "Computer Organisation"),
            ("CSE204", "Object Oriented Programming"), ("CSE205", "Database Systems"), ("CSE206", "Operating Systems")]
RATES = [Decimal("0.95"), Decimal("0.88"), Decimal("0.80"), Decimal("0.72"), Decimal("0.62"), Decimal("0.55")]
FEE_TOTAL = Decimal("120000.00")


def _absent_set(n: int, absent: int, k: int, offset: int) -> set[int]:
    # (i*k + offset) % n permutes 0..n-1 when gcd(k, n) == 1, so exactly `absent` indices fall below `absent`.
    return {i for i in range(n) if (i * k + offset) % n < absent}


def build_demo(db: Session, *, extra_students: int = 40, sessions: int = 200,
               faculty_user_ids: list[uuid.UUID] | None = None, admin_user_id: uuid.UUID | None = None) -> dict:
    rng = random.Random(42)
    campus = Campus(name="Demo Campus", city="Bhubaneswar")
    db.add(campus)
    db.flush()
    prog = Programme(campus_id=campus.id, code="BTECH-CSE", name="B.Tech Computer Science and Engineering")
    year = AcademicYear(campus_id=campus.id, label="2025-26", starts_on=date(2025, 7, 1), ends_on=date(2026, 6, 30))
    db.add_all([prog, year])
    db.flush()
    batch = Batch(campus_id=campus.id, programme_id=prog.id, academic_year_id=year.id, year_of_study=2, section="A")
    subjects = [Subject(programme_id=prog.id, code=c, name=n) for c, n in SUBJECTS]
    faculty = [Faculty(campus_id=campus.id, full_name=f"Demo Faculty {i + 1}", employee_code=f"FAC-{i + 1:03d}",
                       email=f"faculty{i + 1}@demo.campusos.example") for i in range(3)]
    db.add_all([batch, *subjects, *faculty])
    db.flush()
    for i, sub in enumerate(subjects):
        db.add(FacultySubjectAssignment(faculty_id=faculty[i // 2].id, subject_id=sub.id, batch_id=batch.id))

    if faculty_user_ids:
        for uid, fac in zip(faculty_user_ids, faculty):
            db.add(Profile(id=uid, campus_id=campus.id, role="faculty", faculty_id=fac.id, display_name=fac.full_name))
    if admin_user_id:
        db.add(Profile(id=admin_user_id, campus_id=campus.id, role="office_admin", display_name="Demo Office Admin"))

    students = [Student(campus_id=campus.id, batch_id=batch.id, roll_number=SAMPLE_ROLL, full_name="Subhashree Mohanty",
                        year_of_study=2)]
    for i in range(1, extra_students + 1):
        roll = f"ENG-24-CSE-{i:04d}"
        if roll == SAMPLE_ROLL:
            continue
        students.append(Student(campus_id=campus.id, batch_id=batch.id, roll_number=roll, year_of_study=2,
                                full_name=f"{rng.choice(FIRST)} {rng.choice(LAST)}"))
    db.add_all(students)
    db.flush()

    # Attendance: Subhashree = 163/200 present (81.5%); others follow RATES deterministically.
    n = sessions
    absent_for = {}
    for idx, st in enumerate(students):
        if st.roll_number == SAMPLE_ROLL:
            absent_for[st.id] = _absent_set(n, round(n * 0.185), 11, 0) if n == 200 else set()
        else:
            rate = RATES[idx % len(RATES)]
            absent_for[st.id] = _absent_set(n, round(n * float(1 - rate)), 7 if n % 7 else 3, idx % n)
    start = today_ist() - timedelta(days=n // 8 + 1)
    for i in range(n):
        sess = AttendanceSession(
            idempotency_key=uuid.uuid4(), payload_hash=hashlib.sha256(f"seed{i}".encode()).hexdigest(),
            batch_id=batch.id, subject_id=subjects[i % 6].id, faculty_id=faculty[(i % 6) // 2].id,
            held_on=start + timedelta(days=i // 8), period=i % 8 + 1)
        db.add(sess)
        db.flush()
        for st in students:
            db.add(AttendanceRecord(session_id=sess.id, student_id=st.id,
                                    status="absent" if i in absent_for[st.id] else "present"))

    # Internals: IA-1 and IA-2 (max 20 each = 40) for Data Structures, locked. Subhashree 17 + 16 = 33.
    ia = [AssessmentComponent(subject_id=subjects[0].id, batch_id=batch.id, name=name, max_marks=Decimal("20"),
                              lifecycle="locked") for name in ("IA-1", "IA-2")]
    db.add_all(ia)
    db.flush()
    for idx, st in enumerate(students):
        if st.roll_number == SAMPLE_ROLL:
            scores = (Decimal("17"), Decimal("16"))
        else:
            base = [18, 15, 12, 9, 6, 14][idx % 6]
            scores = (Decimal(base), Decimal(max(0, min(20, base + rng.choice([-2, -1, 0, 1, 2])))))
        for comp, sc in zip(ia, scores):
            db.add(Mark(component_id=comp.id, student_id=st.id, score=sc))

    # Fees: one programme fee total; Subhashree fully paid (due 0.00), others partial/unpaid.
    plan = FeePlan(programme_id=prog.id, academic_year_id=year.id, total_amount=FEE_TOTAL)
    db.add(plan)
    db.flush()
    for idx, st in enumerate(students):
        acct = FeeAccount(student_id=st.id, plan_id=plan.id)
        db.add(acct)
        db.flush()
        paid = FEE_TOTAL if st.roll_number == SAMPLE_ROLL else [Decimal("120000"), Decimal("80000"),
                                                                  Decimal("40000"), Decimal("0")][idx % 4]
        if paid > 0:
            pay = FeePayment(account_id=acct.id, amount=paid, kind="simulated", idempotency_key=uuid.uuid4(),
                             recorded_by=admin_user_id or uuid.uuid4())
            db.add(pay)
            db.flush()
            db.add(Receipt(payment_id=pay.id, receipt_number=f"DEMO-SEED-{idx:04d}"))
    db.commit()
    return {"campus": campus, "batch": batch, "subjects": subjects, "faculty": faculty, "students": students,
            "components": ia, "plan": plan}


def parse_user_ids(argv: list[str]) -> tuple[uuid.UUID | None, list[uuid.UUID]]:
    """--admin-user-id <uuid> (once) and --faculty-user-id <uuid> (up to 3) link Supabase Auth users to demo profiles."""
    admin: uuid.UUID | None = None
    faculty: list[uuid.UUID] = []
    for i, a in enumerate(argv):
        if a in ("--admin-user-id", "--faculty-user-id"):
            if i + 1 >= len(argv):
                raise ValueError(f"{a} needs a UUID")
            try:
                value = uuid.UUID(argv[i + 1])
            except ValueError as e:
                raise ValueError(f"{a}: {argv[i + 1]!r} is not a UUID") from e
            if a == "--admin-user-id":
                admin = value
            else:
                faculty.append(value)
    if len(faculty) > 3:
        raise ValueError("at most 3 --faculty-user-id values (the demo has 3 faculty)")
    return admin, faculty


def main() -> int:
    from app.core.config import get_settings
    from app.core.db import get_engine
    settings = get_settings()
    if settings.is_production:
        print("Refusing to seed: APP_ENV=production.")
        return 2
    if "--i-understand-this-writes-demo-data" not in sys.argv:
        print("Dev-only seed. Re-run with --i-understand-this-writes-demo-data against a DEVELOPMENT database.")
        return 2
    try:
        admin_id, faculty_ids = parse_user_ids(sys.argv)
    except ValueError as e:
        print(f"Invalid arguments: {e}")
        return 2
    engine = get_engine()
    if engine is None:
        print("DATABASE_URL is not set.")
        return 2
    with Session(engine) as db:
        if db.scalar(select(func.count()).select_from(Student)):
            print("Refusing to seed: the database already contains students.")
            return 2
        build_demo(db, faculty_user_ids=faculty_ids or None, admin_user_id=admin_id)
        db.commit()
    linked = (1 if admin_id else 0) + len(faculty_ids)
    print(f"Seeded demo data (Subhashree Mohanty ENG-24-CSE-0412 included). Linked {linked} auth user(s) to profiles.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

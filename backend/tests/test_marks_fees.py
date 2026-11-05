import uuid

from sqlalchemy import select

from app.models import AuditEvent, FeePayment, MarksAudit
from tests.conftest import auth

API = "/api/v1"


def make_component(client, world, name="IA-3", max_marks="10"):
    r = client.post(f"{API}/marks/assessments", headers=auth(world["admin_id"]),
                    json={"subject_id": str(world["subjects"][0].id), "batch_id": str(world["batch"].id),
                          "name": name, "max_marks": max_marks})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def scores(world, value="7"):
    return {"scores": [{"student_id": str(s.id), "score": value} for s in world["students"]]}


def test_faculty_score_validation(client, world):
    cid, f = make_component(client, world), auth(world["f_ids"][0])
    url = f"{API}/marks/assessments/{cid}/scores"
    s0 = str(world["students"][0].id)
    assert client.put(url, headers=f, json={"scores": [{"student_id": s0, "score": "10.01"}]}).status_code == 422
    assert client.put(url, headers=f, json={"scores": [{"student_id": s0, "score": "-1"}]}).status_code == 422
    assert client.put(url, headers=f, json={"scores": [{"student_id": s0, "score": "abc"}]}).status_code == 422
    assert client.put(url, headers=f, json={"scores": [{"student_id": s0, "score": "7.123"}]}).status_code == 422
    assert client.put(url, headers=f, json={"scores": [{"student_id": str(uuid.uuid4()), "score": "5"}]}).status_code == 422
    assert client.put(url, headers=f, json=scores(world, "10")).status_code == 200    # exactly max is valid
    assert client.get(f"{API}/marks/assessments/{cid}", headers=f).json()["lifecycle"] == "draft"


def test_invalid_batch_is_all_or_nothing(client, world):
    cid, f = make_component(client, world), auth(world["f_ids"][0])
    good = {"student_id": str(world["students"][0].id), "score": "5"}
    bad = {"student_id": str(world["students"][1].id), "score": "99"}
    assert client.put(f"{API}/marks/assessments/{cid}/scores", headers=f, json={"scores": [good, bad]}).status_code == 422
    assert client.get(f"{API}/marks/assessments/{cid}", headers=f).json()["scores"] == []


def test_full_lifecycle_and_lock_enforcement(client, world, db):
    cid = make_component(client, world)
    f, a = auth(world["f_ids"][0]), auth(world["admin_id"])
    base = f"{API}/marks/assessments/{cid}"
    # cannot submit until every student has a score
    assert client.post(f"{base}/submit", headers=f).status_code == 422
    client.put(f"{base}/scores", headers=f, json=scores(world))
    assert client.post(f"{API}/marks/moderation/{cid}/moderate", headers=f).status_code == 403   # faculty cannot moderate
    assert client.post(f"{base}/submit", headers=a).status_code == 403                           # admin cannot submit
    assert client.post(f"{base}/submit", headers=f).status_code == 200
    assert client.put(f"{base}/scores", headers=f, json=scores(world, "8")).status_code == 409   # read-only after submit
    assert client.post(f"{API}/marks/moderation/{cid}/lock", headers=a).status_code == 409       # must moderate first
    assert client.post(f"{API}/marks/moderation/{cid}/moderate", headers=a).status_code == 200
    assert client.post(f"{API}/marks/moderation/{cid}/lock", headers=a).status_code == 200
    # locked: nobody can write through the normal endpoint
    assert client.put(f"{base}/scores", headers=a, json={**scores(world, "9"), "reason": "x"}).status_code == 409
    assert client.put(f"{base}/scores", headers=f, json=scores(world, "9")).status_code == 409
    # unlock needs a reason; faculty cannot unlock
    assert client.post(f"{API}/marks/moderation/{cid}/unlock", headers=a, json={"reason": ""}).status_code == 422
    assert client.post(f"{API}/marks/moderation/{cid}/unlock", headers=f, json={"reason": "x"}).status_code == 403
    assert client.post(f"{API}/marks/moderation/{cid}/unlock", headers=a, json={"reason": "Typo fix"}).status_code == 200
    assert client.get(base, headers=a).json()["lifecycle"] == "moderated"
    # admin correction needs a reason and is audited with old and new values
    s1 = str(world["students"][1].id)
    assert client.put(f"{base}/scores", headers=a, json={"scores": [{"student_id": s1, "score": "9"}]}).status_code == 422
    ok = client.put(f"{base}/scores", headers=a, json={"scores": [{"student_id": s1, "score": "9"}], "reason": "Re-evaluated"})
    assert ok.status_code == 200
    db.expire_all()
    corr = db.scalars(select(MarksAudit).where(MarksAudit.reason == "Re-evaluated")).one()
    assert str(corr.old_score) == "7.00" and str(corr.new_score) == "9.00"
    actions = {e.action for e in db.scalars(select(AuditEvent))}
    assert {"marks.submitted", "marks.moderated", "marks.locked"} <= actions


def test_faculty_cannot_touch_other_faculty_assessment(client, world):
    cid = make_component(client, world)   # subject 0 belongs to faculty 0
    other = auth(world["f_ids"][2])
    assert client.get(f"{API}/marks/assessments/{cid}", headers=other).status_code == 404
    assert client.put(f"{API}/marks/assessments/{cid}/scores", headers=other, json=scores(world)).status_code == 404
    assert client.get(f"{API}/marks/assessments", headers=other).json() == []


def test_duplicate_assessment_is_a_conflict(client, world):
    make_component(client, world, name="IA-9")
    r = client.post(f"{API}/marks/assessments", headers=auth(world["admin_id"]),
                    json={"subject_id": str(world["subjects"][0].id), "batch_id": str(world["batch"].id),
                          "name": "IA-9", "max_marks": "10"})
    assert r.status_code == 409


# ---------------- fees
def pay(client, world, student, amount, key=None, who=None):
    return client.post(f"{API}/fees/payments", headers=auth(who or world["admin_id"]),
                       json={"idempotency_key": str(key or uuid.uuid4()), "student_id": str(student.id), "amount": amount})


def owing_student(client, world):
    """A student with an outstanding balance (seed gives partial payers)."""
    for s in world["students"]:
        d = client.get(f"{API}/fees/accounts/{s.id}", headers=auth(world["admin_id"])).json()
        if d["outstanding"] == "120000.00":
            return s
    raise AssertionError("no unpaid student in seed")


def test_partial_payment_updates_balance_and_receipt_is_simulated(client, world):
    s = owing_student(client, world)
    r = pay(client, world, s, "20000.50")
    assert r.status_code == 201
    d = r.json()
    assert d["outstanding"] == "99999.50" and d["receipt"]["simulated"] is True and d["receipt"]["kind"] == "simulated"
    assert d["receipt"]["receipt_number"].startswith("DEMO-")
    hist = client.get(f"{API}/fees/accounts/{s.id}", headers=auth(world["admin_id"])).json()
    assert hist["paid"] == "20000.50" and len(hist["payments"]) == 1


def test_payment_replay_never_double_debits(client, world, db):
    s, key = owing_student(client, world), uuid.uuid4()
    first = pay(client, world, s, "5000", key=key)
    again = pay(client, world, s, "5000", key=key)
    assert first.status_code == 201 and again.status_code == 200 and again.json()["created"] is False
    assert again.json()["receipt"]["receipt_number"] == first.json()["receipt"]["receipt_number"]
    assert again.json()["outstanding"] == "115000.00"
    db.expire_all()
    assert len(db.scalars(select(FeePayment).where(FeePayment.idempotency_key == key)).all()) == 1
    assert pay(client, world, s, "6000", key=key).status_code == 409      # same key, different amount


def test_payment_validation_and_permissions(client, world):
    s = owing_student(client, world)
    assert pay(client, world, s, "0").status_code == 422
    assert pay(client, world, s, "-5").status_code == 422
    assert pay(client, world, s, "10.001").status_code == 422
    assert pay(client, world, s, "120000.01").status_code == 422          # exceeds outstanding
    assert pay(client, world, s, "5000", who=world["f_ids"][0]).status_code == 403
    assert pay(client, world, s, "120000").status_code == 201             # exact balance is allowed
    assert pay(client, world, s, "1").status_code == 422                  # now fully paid


def test_decimal_precision_is_exact(client, world):
    s = owing_student(client, world)
    for amt in ("0.10", "0.20", "0.30"):
        assert pay(client, world, s, amt).status_code == 201
    assert client.get(f"{API}/fees/accounts/{s.id}", headers=auth(world["admin_id"])).json()["paid"] == "0.60"

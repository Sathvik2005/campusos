import uuid
from datetime import timedelta

from sqlalchemy import func, select

from app.models import AttendanceRecord, AttendanceSession, AuditEvent
from app.services.attendance import today_ist
from tests.conftest import auth

API = "/api/v1"


def payload(world, *, key=None, subject=0, period=1, status="present", day=None, drop=0, extra=None):
    studs = world["students"][drop:]
    recs = [{"student_id": str(s.id), "status": status} for s in studs]
    if extra:
        recs.append(extra)
    return {"idempotency_key": str(key or uuid.uuid4()), "batch_id": str(world["batch"].id),
            "subject_id": str(world["subjects"][subject].id), "held_on": str(day or today_ist()),
            "period": period, "records": recs}


def count_sessions(db):
    db.expire_all()
    return db.scalar(select(func.count()).select_from(AttendanceSession))


def test_first_submission_creates_session_and_records(client, world, db):
    before = count_sessions(db)
    r = client.post(f"{API}/attendance/sync", headers=auth(world["f_ids"][0]), json=payload(world))
    assert r.status_code == 201 and r.json()["created"] is True and r.json()["record_count"] == 12
    assert count_sessions(db) == before + 1


def test_replay_of_same_key_and_payload_is_a_noop(client, world, db):
    key = uuid.uuid4()
    h = auth(world["f_ids"][0])
    first = client.post(f"{API}/attendance/sync", headers=h, json=payload(world, key=key))
    before = count_sessions(db)
    records_before = db.scalar(select(func.count()).select_from(AttendanceRecord))
    second = client.post(f"{API}/attendance/sync", headers=h, json=payload(world, key=key))
    third = client.post(f"{API}/attendance/sync", headers=h, json=payload(world, key=key))
    assert second.status_code == 200 and second.json()["created"] is False
    assert second.json()["session_id"] == first.json()["session_id"] == third.json()["session_id"]
    db.expire_all()
    assert count_sessions(db) == before
    assert db.scalar(select(func.count()).select_from(AttendanceRecord)) == records_before


def test_same_key_with_different_payload_is_an_idempotency_conflict(client, world):
    key, h = uuid.uuid4(), auth(world["f_ids"][0])
    assert client.post(f"{API}/attendance/sync", headers=h, json=payload(world, key=key)).status_code == 201
    r = client.post(f"{API}/attendance/sync", headers=h, json=payload(world, key=key, status="absent"))
    assert r.status_code == 409 and "idempotency_conflict" in r.json()["error"]["message"]


def test_same_class_date_period_with_new_key_is_a_conflict_not_a_duplicate(client, world, db):
    h = auth(world["f_ids"][0])
    assert client.post(f"{API}/attendance/sync", headers=h, json=payload(world)).status_code == 201
    before = count_sessions(db)
    r = client.post(f"{API}/attendance/sync", headers=h, json=payload(world, status="absent"))
    assert r.status_code == 409 and "session_conflict" in r.json()["error"]["message"]
    assert count_sessions(db) == before


def test_incomplete_or_invalid_rosters_are_rejected_and_nothing_is_saved(client, world, db):
    h, before = auth(world["f_ids"][0]), count_sessions(db)
    assert client.post(f"{API}/attendance/sync", headers=h, json=payload(world, drop=1)).status_code == 422
    stranger = {"student_id": str(uuid.uuid4()), "status": "present"}
    assert client.post(f"{API}/attendance/sync", headers=h, json=payload(world, extra=stranger)).status_code == 422
    dup = payload(world)
    dup["records"].append(dup["records"][0])
    assert client.post(f"{API}/attendance/sync", headers=h, json=dup).status_code == 422
    assert client.post(f"{API}/attendance/sync", headers=h, json=payload(world, status="excused")).status_code == 422
    assert count_sessions(db) == before


def test_faculty_must_be_assigned_to_the_subject(client, world):
    # faculty 0 teaches subjects 0-1; subject 5 belongs to faculty 2
    r = client.post(f"{API}/attendance/sync", headers=auth(world["f_ids"][0]), json=payload(world, subject=5))
    assert r.status_code == 403
    assert client.post(f"{API}/attendance/sync", headers=auth(world["f_ids"][2]),
                       json=payload(world, subject=5)).status_code == 201


def test_admin_cannot_submit_attendance_and_future_dates_are_rejected(client, world):
    assert client.post(f"{API}/attendance/sync", headers=auth(world["admin_id"]), json=payload(world)).status_code == 403
    future = today_ist() + timedelta(days=1)
    assert client.post(f"{API}/attendance/sync", headers=auth(world["f_ids"][0]),
                       json=payload(world, day=future)).status_code == 422
    assert client.post(f"{API}/attendance/sync", headers=auth(world["f_ids"][0]),
                       json=payload(world, period=9)).status_code == 422


def test_online_save_endpoint_shares_the_same_idempotency(client, world):
    key, h = uuid.uuid4(), auth(world["f_ids"][0])
    a = client.post(f"{API}/attendance/sessions", headers=h, json=payload(world, key=key))
    b = client.post(f"{API}/attendance/sync", headers=h, json=payload(world, key=key))
    assert a.status_code == 201 and b.status_code == 200 and a.json()["session_id"] == b.json()["session_id"]


def test_roster_is_scoped_to_assignment(client, world):
    q = {"batch_id": str(world["batch"].id), "subject_id": str(world["subjects"][5].id)}
    assert client.get(f"{API}/attendance/roster", headers=auth(world["f_ids"][0]), params=q).status_code == 403
    r = client.get(f"{API}/attendance/roster", headers=auth(world["f_ids"][2]), params=q)
    assert r.status_code == 200 and len(r.json()["students"]) == 12


def test_admin_correction_requires_reason_and_is_audited(client, world, db):
    h = auth(world["f_ids"][0])
    sid = client.post(f"{API}/attendance/sync", headers=h, json=payload(world)).json()["session_id"]
    admin = auth(world["admin_id"])
    target = str(world["students"][1].id)
    body = {"reason": "", "records": [{"student_id": target, "status": "absent"}]}
    assert client.put(f"{API}/attendance/sessions/{sid}/correction", headers=admin, json=body).status_code in (422,)
    body["reason"] = "Marked in error"
    assert client.put(f"{API}/attendance/sessions/{sid}/correction", headers=h, json=body).status_code == 403
    assert client.put(f"{API}/attendance/sessions/{sid}/correction", headers=admin, json=body).status_code == 200
    db.expire_all()
    ev = db.scalar(select(AuditEvent).where(AuditEvent.action == "attendance.corrected"))
    assert ev.reason == "Marked in error" and ev.new_value[target] == "absent" and ev.old_value[target] == "present"


def test_session_detail_is_scoped(client, world):
    h = auth(world["f_ids"][0])
    sid = client.post(f"{API}/attendance/sync", headers=h, json=payload(world)).json()["session_id"]
    ok = client.get(f"{API}/attendance/sessions/{sid}", headers=h)
    assert ok.status_code == 200 and len(ok.json()["records"]) >= 1
    assert client.get(f"{API}/attendance/sessions/{sid}", headers=auth(world["admin_id"])).status_code == 200
    assert client.get(f"{API}/attendance/sessions/{sid}", headers=auth(world["f_ids"][1])).status_code == 404

import uuid

from tests.conftest import _OTHER_KEY, auth, make_token

API = "/api/v1"


def test_unauthenticated_requests_are_rejected(client, world):
    assert client.get(f"{API}/auth/me").status_code == 401
    assert client.get(f"{API}/students").status_code == 401
    assert client.get(f"{API}/fees/accounts").status_code == 401


def test_bad_tokens_are_rejected(client, world):
    uid = world["admin_id"]
    h = lambda t: {"Authorization": f"Bearer {t}"}  # noqa: E731
    assert client.get(f"{API}/auth/me", headers=h("garbage")).status_code == 401
    assert client.get(f"{API}/auth/me", headers=h(make_token(uid, expires_in=-60))).status_code == 401
    assert client.get(f"{API}/auth/me", headers=h(make_token(uid, aud="wrong"))).status_code == 401
    assert client.get(f"{API}/auth/me", headers=h(make_token(uid, key=_OTHER_KEY))).status_code == 401


def test_valid_token_without_profile_is_forbidden(client, world):
    assert client.get(f"{API}/auth/me", headers=auth(uuid.uuid4())).status_code == 403


def test_me_returns_role_from_database(client, world):
    r = client.get(f"{API}/auth/me", headers=auth(world["admin_id"]))
    assert r.status_code == 200 and r.json()["role"] == "office_admin"
    r = client.get(f"{API}/auth/me", headers=auth(world["f_ids"][0]))
    assert r.json()["role"] == "faculty"


def test_sample_student_matches_client_record_exactly(client, world):
    sid = world["students"][0].id
    r = client.get(f"{API}/students/{sid}", headers=auth(world["admin_id"]))
    d = r.json()
    assert d["full_name"] == "Subhashree Mohanty" and d["roll_number"] == "ENG-24-CSE-0412" and d["year_of_study"] == 2
    assert d["attendance_pct"] == "81.5"
    assert (d["internals_score"], d["internals_max"]) == ("33.00", "40.00")
    assert d["fees"]["outstanding"] == "0.00"


def test_faculty_never_receives_fee_data(client, world):
    sid = world["students"][0].id
    d = client.get(f"{API}/students/{sid}", headers=auth(world["f_ids"][0])).json()
    assert d["fees"] is None
    assert client.get(f"{API}/fees/accounts", headers=auth(world["f_ids"][0])).status_code == 403
    assert client.get(f"{API}/fees/accounts/{sid}", headers=auth(world["f_ids"][0])).status_code == 403


def test_directory_search_filter_pagination(client, world):
    h = auth(world["admin_id"])
    assert client.get(f"{API}/students", headers=h, params={"q": "subhashree"}).json()["total"] == 1
    assert client.get(f"{API}/students", headers=h, params={"q": "0412"}).json()["total"] == 1
    page = client.get(f"{API}/students", headers=h, params={"page_size": 5, "page": 2}).json()
    assert page["total"] == 12 and len(page["items"]) == 5
    assert client.get(f"{API}/students", headers=h, params={"page_size": 1000}).status_code == 422


def test_search_is_safe_against_sql_injection_strings(client, world):
    r = client.get(f"{API}/students", headers=auth(world["admin_id"]), params={"q": "' OR 1=1 --"})
    assert r.status_code == 200 and r.json()["total"] == 0


def test_faculty_cannot_see_students_outside_assigned_batches(client, world, db):
    from app.models import AcademicYear, Batch, Student
    year = db.query(AcademicYear).one()
    other = Batch(campus_id=world["campus"].id, programme_id=world["batch"].programme_id, academic_year_id=year.id,
                  year_of_study=3, section="B")
    db.add(other)
    db.flush()
    st = Student(campus_id=world["campus"].id, batch_id=other.id, roll_number="ENG-23-CSE-9001", full_name="Other Batch",
                 year_of_study=3)
    db.add(st)
    db.commit()
    f = auth(world["f_ids"][0])
    assert client.get(f"{API}/students/{st.id}", headers=f).status_code == 404      # IDOR: not revealed
    assert client.get(f"{API}/students/{st.id}", headers=auth(world["admin_id"])).status_code == 200
    assert client.get(f"{API}/students", headers=f, params={"q": "Other Batch"}).json()["total"] == 0


def test_student_create_validation_and_duplicates(client, world):
    h = auth(world["admin_id"])
    body = {"batch_id": str(world["batch"].id), "roll_number": "ENG-24-CSE-0999", "full_name": "New Student"}
    assert client.post(f"{API}/students", headers=h, json=body).status_code == 201
    assert client.post(f"{API}/students", headers=h, json=body).status_code == 409
    assert client.post(f"{API}/students", headers=auth(world["f_ids"][0]), json=body).status_code == 403
    # mass assignment: unknown fields (role/campus) are rejected
    bad = {**body, "roll_number": "ENG-24-CSE-0998", "campus_id": str(uuid.uuid4())}
    assert client.post(f"{API}/students", headers=h, json=bad).status_code == 422


def test_academic_masters_permissions_and_duplicates(client, world):
    h, f = auth(world["admin_id"]), auth(world["f_ids"][0])
    prog = {"code": "BTECH-IT", "name": "B.Tech IT"}
    assert client.post(f"{API}/academic/programmes", headers=f, json=prog).status_code == 403
    assert client.post(f"{API}/academic/programmes", headers=h, json=prog).status_code == 201
    assert client.post(f"{API}/academic/programmes", headers=h, json=prog).status_code == 409
    assert client.get(f"{API}/academic/faculty", headers=f).status_code == 403
    # faculty only see classes they are assigned to
    subs = client.get(f"{API}/academic/subjects", headers=f).json()
    assert {x["code"] for x in subs} == {"CSE201", "CSE202"}
    assert len(client.get(f"{API}/academic/subjects", headers=h).json()) == 6


def test_audit_log_is_admin_only_and_read_only(client, world):
    h = auth(world["admin_id"])
    client.post(f"{API}/academic/programmes", headers=h, json={"code": "X1", "name": "X"})
    ev = client.get(f"{API}/audit", headers=h).json()
    assert ev["total"] >= 1 and ev["items"][0]["action"] == "academic.programme_created"
    assert client.get(f"{API}/audit", headers=auth(world["f_ids"][0])).status_code == 403
    assert client.post(f"{API}/audit", headers=h, json={}).status_code == 405
    assert client.delete(f"{API}/audit/{ev['items'][0]['id']}", headers=h).status_code in (404, 405)

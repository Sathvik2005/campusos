import json
import uuid
from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.ai import explainer
from app.models import AttendanceRecord, FeePayment, Mark, MentorTask, RiskAssessment
from app.services import risk
from app.services.attendance import today_ist
from tests.conftest import auth

API = "/api/v1"
D = Decimal


# ---------- deterministic rules (no database, no AI)
@pytest.mark.parametrize("att,cat", [("74.9", "watch"), ("75", "on_track"), ("75.1", "on_track"),
                                      ("65", "watch"), ("64.9", "at_risk")])
def test_attendance_thresholds(att, cat):
    assert risk.assess(D(att), (D("30"), D("40"))).category == cat


def test_internals_threshold_boundary():
    assert risk.assess(D("90"), (D("16"), D("40"))).category == "on_track"      # exactly 40%
    assert risk.assess(D("90"), (D("15.9"), D("40"))).category == "at_risk"


def test_missing_data_is_reported_not_guessed():
    none = risk.assess(None, None)
    assert none.confidence == "insufficient" and none.category == "on_track"
    only_att = risk.assess(D("70"), None)
    assert only_att.confidence == "limited" and only_att.category == "watch"
    assert any(i["code"] == "internals_missing" for i in only_att.indicators)


def test_results_are_reproducible_and_versioned():
    a, b = risk.assess(D("60"), (D("10"), D("40"))), risk.assess(D("60"), (D("10"), D("40")))
    assert a == b and a.rule_version == risk.RULE_VERSION
    assert {i["code"] for i in a.indicators} == {"attendance_severe", "internals_low"}   # each reason preserved


# ---------- AI boundary
def payload_for(att="70", ints=(D("30"), D("40"))):
    r = risk.assess(D(att), ints)
    return explainer.build_payload(r.category, r.confidence, r.indicators, r.evidence)


class Fake:
    def __init__(self, out=None, exc=None):
        self.out, self.exc, self.seen = out, exc, None

    def generate(self, payload, timeout_s):
        self.seen = payload
        if self.exc:
            raise self.exc
        return self.out


def good(summary="Attendance is 70 which is below 75.", follow="Check in with the student about attendance."):
    return json.dumps({"summary": summary, "follow_up": follow})


def test_valid_explanation_is_accepted():
    st, text, _ = explainer.explain(payload_for(), Fake(good()))
    assert st == "available" and "Suggested follow-up" in text


@pytest.mark.parametrize("fake,reason", [
    (None, "provider_not_configured"),
    (Fake(exc=explainer.ProviderError("timeout")), "provider_error"),
    (Fake(exc=RuntimeError("boom")), "provider_error"),
    (Fake(out="not json"), "invalid_output"),
    (Fake(out=json.dumps({"summary": "x"})), "invalid_output"),
    (Fake(out=json.dumps({"summary": "x", "follow_up": "y", "extra": "z"})), "invalid_output"),
    (Fake(out=good("Attendance is 42 percent.")), "unsupported_claims"),
])
def test_bad_ai_outputs_fail_closed(fake, reason):
    st, text, why = explainer.explain(payload_for(), fake)
    assert (st, text, why) == ("unavailable", None, reason)


def test_ai_payload_has_no_identifiers():
    fake = Fake(good())
    explainer.explain(payload_for(), fake)
    blob = json.dumps(fake.seen).lower()
    for forbidden in ("name", "roll", "subhashree", "eng-24", "student_id"):
        assert forbidden not in blob


# ---------- endpoints
def test_insights_are_admin_only(client, world):
    f = auth(world["f_ids"][0])
    sid = world["students"][0].id
    for method, url in [("get", "/insights/at-risk"), ("get", f"/insights/students/{sid}"),
                        ("post", f"/insights/students/{sid}/assess"), ("get", "/mentor-tasks")]:
        assert getattr(client, method)(f"{API}{url}", headers=f).status_code == 403, url


def test_at_risk_overview_shows_evidence_without_any_ai(client, world):
    rows = client.get(f"{API}/insights/at-risk", headers=auth(world["admin_id"])).json()
    assert rows, "seed contains low-attendance students"
    assert all(r["indicators"] and r["rule_version"] == risk.RULE_VERSION for r in rows)
    assert "ENG-24-CSE-0412" not in {r["roll_number"] for r in rows}      # sample student is on track


def test_assess_persists_rules_even_when_ai_is_unavailable_and_changes_no_records(client, world, db):
    flagged = client.get(f"{API}/insights/at-risk", headers=auth(world["admin_id"])).json()[0]
    snap = lambda: (db.scalar(select(func.count()).select_from(AttendanceRecord)),  # noqa: E731
                    db.scalar(select(func.count()).select_from(Mark)), db.scalar(select(func.count()).select_from(FeePayment)),
                    db.scalar(select(func.sum(Mark.score))))
    before = snap()
    r = client.post(f"{API}/insights/students/{flagged['student_id']}/assess", headers=auth(world["admin_id"]))
    assert r.status_code == 201
    d = r.json()
    assert d["category"] == flagged["category"] and d["persisted"] is True
    assert d["explanation_status"] == "unavailable" and d["explanation"] is None
    assert "rule-based assessment" in d["explanation_note"]
    db.expire_all()
    assert snap() == before                                               # AI/assessment never mutates records
    client.post(f"{API}/insights/students/{flagged['student_id']}/assess", headers=auth(world["admin_id"]))
    hist = client.get(f"{API}/insights/students/{flagged['student_id']}/history", headers=auth(world["admin_id"])).json()
    assert len(hist) == 2                                                  # history appended, never overwritten


def test_assess_with_a_working_provider_labels_ai_text(client, world, monkeypatch):
    from app.api.v1.endpoints import insights as ep
    from app.main import app
    sid = [r for r in client.get(f"{API}/insights/at-risk", headers=auth(world["admin_id"])).json()][0]
    seen = client.get(f"{API}/insights/students/{sid['student_id']}", headers=auth(world["admin_id"])).json()
    att = seen["attendance_pct"]
    fake = Fake(good(f"Attendance is {att}.", "Offer a supportive check-in."))
    app.dependency_overrides[ep._provider] = lambda: fake
    try:
        d = client.post(f"{API}/insights/students/{sid['student_id']}/assess", headers=auth(world["admin_id"])).json()
    finally:
        app.dependency_overrides.pop(ep._provider, None)
    assert d["explanation_status"] == "available" and "AI-generated" in d["explanation_note"]


def test_mentor_task_requires_human_action_and_is_audited(client, world, db):
    a, sid = auth(world["admin_id"]), str(world["students"][3].id)
    assert db.scalar(select(func.count()).select_from(MentorTask)) == 0
    client.post(f"{API}/insights/students/{sid}/assess", headers=a)
    assert db.scalar(select(func.count()).select_from(MentorTask)) == 0   # assessing never creates a task
    fac = str(world["faculty"][1].id)
    body = {"student_id": sid, "title": "Check in on attendance", "assignee_faculty_id": fac,
            "due_on": str(today_ist())}
    t = client.post(f"{API}/mentor-tasks", headers=a, json=body)
    assert t.status_code == 201 and t.json()["status"] == "open"
    tid = t.json()["id"]
    assert client.patch(f"{API}/mentor-tasks/{tid}", headers=a, json={"status": "completed"}).status_code == 409
    assert client.patch(f"{API}/mentor-tasks/{tid}", headers=a, json={"status": "in_progress"}).status_code == 200
    assert client.patch(f"{API}/mentor-tasks/{tid}", headers=a, json={"status": "cancelled"}).status_code == 422
    assert client.patch(f"{API}/mentor-tasks/{tid}", headers=a, json={"status": "completed"}).status_code == 200
    assert client.patch(f"{API}/mentor-tasks/{tid}", headers=a, json={"status": "in_progress"}).status_code == 409
    log = client.get(f"{API}/audit", headers=a, params={"entity_type": "mentor_task"}).json()
    assert {e["action"] for e in log["items"]} == {"mentor_task.created", "mentor_task.status_changed"}


def test_mentor_task_validation(client, world):
    a, sid = auth(world["admin_id"]), str(world["students"][3].id)
    past = {"student_id": sid, "title": "x", "due_on": "2020-01-01"}
    assert client.post(f"{API}/mentor-tasks", headers=a, json=past).status_code == 422
    bad_assignee = {"student_id": sid, "title": "x", "assignee_faculty_id": str(uuid.uuid4())}
    assert client.post(f"{API}/mentor-tasks", headers=a, json=bad_assignee).status_code == 422
    assert client.post(f"{API}/mentor-tasks", headers=a, json={"student_id": str(uuid.uuid4()), "title": "x"}).status_code == 404


def test_overview_is_role_shaped(client, world):
    adm = client.get(f"{API}/overview", headers=auth(world["admin_id"])).json()
    assert adm["active_students"] == 12 and "outstanding_dues" in adm
    fac = client.get(f"{API}/overview", headers=auth(world["f_ids"][0])).json()
    assert fac["role"] == "faculty" and "outstanding_dues" not in fac


# ---------- real provider adapter (HTTP mocked; no network, no key)
def _provider(handler):
    import httpx

    return explainer.AnthropicProvider("test-key", client=httpx.Client(transport=httpx.MockTransport(handler)))


def _payload():
    r = risk.assess(D("60"), (D("14"), D("40")))
    return explainer.build_payload(r.category, r.confidence, r.indicators, r.evidence)


def test_provider_sends_only_rule_output_and_parses_text():
    import httpx

    seen = {}

    def handler(req: httpx.Request):
        seen["body"] = json.loads(req.content)
        seen["key"] = req.headers["x-api-key"]
        text = json.dumps({"summary": "Attendance 60 is below 65 and internals 14/40 are low.", "follow_up": "Offer a supportive check-in."})
        return httpx.Response(200, json={"content": [{"type": "text", "text": text}]})

    status, text, reason = explainer.explain(_payload(), _provider(handler))
    assert status == "available" and "check-in" in text and reason is None
    sent = seen["body"]["messages"][0]["content"]
    assert "name" not in sent.lower() and "roll" not in sent.lower()      # no identifiers leave the system
    assert seen["key"] == "test-key"


@pytest.mark.parametrize("handler_status", [500, 429, 401])
def test_provider_http_failure_fails_closed(handler_status):
    import httpx

    status, text, reason = explainer.explain(_payload(), _provider(lambda req: httpx.Response(handler_status, json={})))
    assert (status, text, reason) == ("unavailable", None, "provider_error")


def test_provider_non_json_text_is_discarded():
    import httpx

    h = lambda req: httpx.Response(200, json={"content": [{"type": "text", "text": "Sure! Here you go."}]})  # noqa: E731
    assert explainer.explain(_payload(), _provider(h))[0:3:2] == ("unavailable", "invalid_output")


def test_provider_invented_numbers_are_rejected():
    import httpx

    t = json.dumps({"summary": "Attendance 42 is very low.", "follow_up": "Call home."})
    h = lambda req: httpx.Response(200, json={"content": [{"type": "text", "text": t}]})  # noqa: E731
    assert explainer.explain(_payload(), _provider(h))[0:3:2] == ("unavailable", "unsupported_claims")


def test_no_key_means_no_provider(monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.get_settings(), "ai_provider_api_key", None, raising=False)
    assert explainer.get_provider() is None

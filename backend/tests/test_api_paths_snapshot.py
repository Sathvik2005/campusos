import json

from tools.dump_api_paths import TARGET, current


def test_frontend_route_snapshot_is_up_to_date():
    """If this fails, run `python -m tools.dump_api_paths` from backend/ and commit the result."""
    assert json.loads(TARGET.read_text(encoding="utf-8")) == current()

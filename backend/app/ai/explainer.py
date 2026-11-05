"""Optional AI explanation boundary (docs/phase-9, PD-13). This module has NO database access and
cannot write anything. It receives rule output only, never names or identifiers, validates the
model's JSON against a schema, and fails closed: any problem -> status "unavailable", no text.
No provider is wired yet (owner decision); get_provider() returns None until one is chosen."""
import json
import logging
import re
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field, ValidationError

log = logging.getLogger(__name__)


class ProviderError(Exception):
    """Timeout, rate limit, provider outage or transport failure."""


class ExplanationProvider(Protocol):
    def generate(self, payload: dict, timeout_s: float) -> str: ...


class ExplanationOut(BaseModel):
    model_config = ConfigDict(extra="forbid")
    summary: str = Field(min_length=1, max_length=700)
    follow_up: str = Field(min_length=1, max_length=350)


def get_provider() -> ExplanationProvider | None:
    return None


def build_payload(category: str, confidence: str, indicators: list[dict], evidence: dict) -> dict:
    """Minimal, PII-free input: no student name, roll number or any identifier."""
    return {
        "risk_category": category,
        "confidence": confidence,
        "indicators": [i["text"] for i in indicators],
        "numbers": {k: v for k, v in evidence.items() if k != "thresholds" and v is not None},
        "thresholds": evidence.get("thresholds", {}),
    }


_NUM = re.compile(r"\d+(?:\.\d+)?")


def _numbers(text: str) -> set[str]:
    return {n.rstrip("0").rstrip(".") if "." in n else n for n in _NUM.findall(text)}


def explain(payload: dict, provider: ExplanationProvider | None, timeout_s: float = 8.0) -> tuple[str, str | None, str | None]:
    """Returns (status, text, reason). status in {"available", "unavailable"}."""
    if provider is None:
        return "unavailable", None, "provider_not_configured"
    try:
        raw = provider.generate(payload, timeout_s)
        parsed = ExplanationOut.model_validate(json.loads(raw))
    except ProviderError:
        log.warning("AI provider failed")
        return "unavailable", None, "provider_error"
    except (json.JSONDecodeError, ValidationError, TypeError):
        log.warning("AI output rejected (invalid structure)")
        return "unavailable", None, "invalid_output"
    except Exception:  # noqa: BLE001
        log.warning("AI explanation failed unexpectedly")
        return "unavailable", None, "provider_error"

    text = f"{parsed.summary}\n\nSuggested follow-up: {parsed.follow_up}"
    allowed = _numbers(json.dumps(payload))
    if not _numbers(text) <= allowed:     # any number not present in the evidence is invented
        log.warning("AI output rejected (unsupported numbers)")
        return "unavailable", None, "unsupported_claims"
    return "available", text, None

"""Optional AI explanation boundary (docs/phase-9, PD-13). This module has NO database access and
cannot write anything. It receives rule output only, never names or identifiers, validates the
model's JSON against a schema, and fails closed: any problem -> status "unavailable", no text.
The Anthropic adapter is used only when AI_PROVIDER_API_KEY is set; otherwise get_provider() returns None."""
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


AI_MODEL = "claude-haiku-5-5"
_SYSTEM = (
    "You explain an academic risk assessment that was already decided by fixed rules. "
    "You do not decide the category, never diagnose, never speculate about personal circumstances, "
    "and never mention any number that is not in the provided data. "
    'Reply with JSON only: {"summary": "<=2 sentences explaining the evidence", '
    '"follow_up": "one neutral, supportive next step for a mentor"}.'
)


class AnthropicProvider:
    """Calls the Anthropic Messages API with rule output only (no names or identifiers).
    Any transport, status or shape problem raises ProviderError; explain() then fails closed."""

    def __init__(self, api_key: str, client=None, model: str = AI_MODEL):
        self._key, self._model, self._client = api_key, model, client

    def generate(self, payload: dict, timeout_s: float) -> str:
        import httpx

        body = {
            "model": self._model,
            "max_tokens": 400,
            "system": _SYSTEM,
            "messages": [{"role": "user", "content": json.dumps(payload)}],
        }
        headers = {"x-api-key": self._key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
        try:
            client = self._client or httpx.Client(timeout=timeout_s)
            resp = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
            resp.raise_for_status()
            return "".join(b.get("text", "") for b in resp.json().get("content", []) if b.get("type") == "text")
        except (httpx.HTTPError, ValueError, AttributeError) as e:
            raise ProviderError(type(e).__name__) from e


def get_provider() -> ExplanationProvider | None:
    """None when no key is configured: the deterministic result is shown without AI text."""
    from app.core.config import get_settings

    key = get_settings().ai_provider_api_key
    return AnthropicProvider(key) if key else None


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

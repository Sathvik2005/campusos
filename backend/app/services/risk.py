"""Deterministic risk engine (PD-04, PD-05, PD-29, PD-30). No model involved; same inputs and
rule version always give the same result. This is a rules engine, not a trained predictive model."""
import uuid
from dataclasses import dataclass, field
from decimal import Decimal

RULE_VERSION = "rules-v1"
WATCH_BELOW = Decimal("75")      # attendance below 75% -> shortage
AT_RISK_BELOW = Decimal("65")    # attendance below 65% -> at risk
INTERNALS_BELOW = Decimal("0.40")  # internals below 40% of max -> at risk


@dataclass
class RiskResult:
    category: str                      # on_track | watch | at_risk
    confidence: str                    # sufficient | limited | insufficient
    indicators: list[dict] = field(default_factory=list)
    evidence: dict = field(default_factory=dict)
    rule_version: str = RULE_VERSION


def assess(attendance_pct: Decimal | None, internals: tuple[Decimal, Decimal] | None) -> RiskResult:
    evidence = {
        "attendance_pct": None if attendance_pct is None else str(attendance_pct),
        "internals_score": None if internals is None else str(internals[0]),
        "internals_max": None if internals is None else str(internals[1]),
        "thresholds": {"attendance_watch_below": str(WATCH_BELOW), "attendance_at_risk_below": str(AT_RISK_BELOW),
                       "internals_at_risk_below_fraction": str(INTERNALS_BELOW)},
    }
    if attendance_pct is None and internals is None:
        return RiskResult("on_track", "insufficient",
                          [{"code": "no_data", "text": "No attendance or marks recorded yet."}], evidence)

    indicators: list[dict] = []
    severe = False
    concern = False
    if attendance_pct is not None:
        if attendance_pct < AT_RISK_BELOW:
            severe = True
            indicators.append({"code": "attendance_severe",
                               "text": f"Attendance {attendance_pct}% is below {AT_RISK_BELOW}%."})
        elif attendance_pct < WATCH_BELOW:
            concern = True
            indicators.append({"code": "attendance_shortage",
                               "text": f"Attendance {attendance_pct}% is below {WATCH_BELOW}%."})
    else:
        indicators.append({"code": "attendance_missing", "text": "No attendance data."})
    if internals is not None:
        score, mx = internals
        if mx > 0 and score / mx < INTERNALS_BELOW:
            severe = True
            indicators.append({"code": "internals_low",
                               "text": f"Internals {score}/{mx} are below {int(INTERNALS_BELOW * 100)}% of maximum."})
    else:
        indicators.append({"code": "internals_missing", "text": "No official internal marks yet."})

    confidence = "sufficient" if attendance_pct is not None and internals is not None else "limited"
    if severe:
        category = "at_risk"
    elif concern:
        category = "watch"
    else:
        category = "on_track"
    return RiskResult(category, confidence, indicators, evidence)

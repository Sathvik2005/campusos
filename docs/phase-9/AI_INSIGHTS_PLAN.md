# CampusOS — Phase 9: AI student insights plan

**Objective:** deterministic rules first, optional model explanation, mentor tasks. Rules PD-04, PD-05, PD-13, PD-14, PD-29, PD-30; screens S-16, S-17.

## 1. Build order
| Step | Work | Verification |
| --- | --- | --- |
| 9.1 | Rules engine finalised and versioned (`rule_version`): attendance < 75 → watch; < 65 or internals < 40% → at_risk; confidence sufficient / limited / insufficient | unit tests at 64.9, 65, 74.9, 75, missing data |
| 9.2 | Evidence payload: only the numbers and thresholds the rules used (no names, no fees, no free text) sent to the model | test that the payload has no PII fields |
| 9.3 | AI adapter: timeout, strict JSON schema, invalid output discarded, one retry at most, key from `AI_API_KEY` only | missing key, timeout, malformed, provider 5xx → `unavailable` |
| 9.4 | Insights UI: flagged list + evidence; explanation labelled "AI-generated" only when it truly is; otherwise "Rule-based summary" | Playwright with key unset |
| 9.5 | Mentor tasks: explicit Admin action only; audited | permission tests |

## 2. Hard rules
- The model never writes marks, attendance, fees, risk category or tasks. The adapter has no database write path.
- No invented evidence: the explanation may only reference provided fields.
- Logs never contain the API key or student identifiers beyond opaque ids.
- Do not describe the rules engine as a trained predictive model anywhere.

## 3. Exit criteria
Removing `AI_API_KEY` still shows every flag with evidence. Malformed or slow provider output never breaks the page. Faculty receive 403 on Insights. Prompt/payload shape documented.

## 4. Approval gates
Owner supplies the provider key and chooses the provider; confirm what data classes may leave the system before the first live call.

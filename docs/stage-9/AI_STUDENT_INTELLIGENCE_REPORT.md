# Stage 9 report: student intelligence (2026-11-05)

## Deterministic rules (source of truth for the category)
`backend/app/services/risk.py`, rule version `rules-v1`. A rules engine, not a trained model.
| Input | Rule | Result |
|---|---|---|
| Attendance < 65% | severe | High risk (`at_risk`) |
| Attendance 65% to < 75% | shortage (75% is the stated policy line) | Moderate (`watch`) |
| Internals < 40% of max | severe | High |
| otherwise | | Low (`on_track`) |
| No attendance and no marks | | confidence `insufficient` -> shown as "Insufficient data" |
Only one of the two inputs present -> confidence `limited`, missing input listed as an indicator (never guessed).
**Honesty note:** the 75% attendance line is the requirement given; the 65% and 40% thresholds are our documented choices, not institutional policy (see `docs/ASSUMPTIONS.md`). They live as named constants and are echoed in each assessment's `evidence.thresholds`.
Stored per assessment (`risk_assessments`): category, confidence, indicators, evidence (inputs + thresholds), rule version, timestamp. `GET /insights/students/{id}/history` returns past calculations (trend list in the UI).

## AI explanation layer (optional, fails closed)
- `backend/app/ai/explainer.py`: no DB access; input is rule output only (no name, roll number or id); output must validate against `{summary, follow_up}` JSON; any number not present in the evidence causes rejection; any provider/transport/JSON problem -> status `unavailable` and the UI shows the deterministic evidence plus "AI explanation unavailable".
- `AnthropicProvider` (model `claude-haiku-5-5`) is used **only if `AI_PROVIDER_API_KEY` is set**. No key is set anywhere in this repo, so **no real model call has been made**; the adapter is tested with a mocked HTTP transport only.
- The model never writes marks, attendance, fees or tasks.

## Mentor workflow
Admin reviews the evidence, opens "Create mentor task", edits the suggested title/notes/due date, and presses "Approve and create task"; nothing is created before that press (tested). Status updates (start, complete) are available. The API audits task creation/changes.
Gaps vs the brief: the form has no assignee picker or completion-notes field (the API accepts `assignee_faculty_id` and notes); not built.

## Evidence
pytest 68/68 (31 insights tests incl. thresholds at boundaries, reproducibility, provider success/failure/non-JSON/invented numbers/no-key); Vitest 89/89 (category mapping, evidence + fallback, trend, approval gate).
## Not verified
Any real model response; real-login browser run of the Insights screen.

# CampusOS — Phase 3: Template sign-off and exit checklist

Phase 3 exit (from `docs/phase-0/PHASED_IMPLEMENTATION_PLAN.md`): template list signed off (seven modules). Stitch is reference, not source of truth.

## 1. Templates

| # | Template | Screens | Source doc |
| --- | --- | --- | --- |
| 1 | Overview (editorial) | S-02, S-03 | DESIGN_SYSTEM §6 |
| 2 | Students (directory) | S-04, S-05, S-06, S-18 (Audit reuses table pattern) | DESIGN_SYSTEM §6 |
| 3 | Academics (settings) | S-07 | DESIGN_SYSTEM §6 |
| 4 | Attendance (task workspace) | S-08, S-09, S-10 | RESPONSIVE_CONTRACT §5–6 |
| 5 | Marks (spreadsheet) | S-11, S-12 | RESPONSIVE_CONTRACT §5 |
| 6 | Fees (ledger) | S-13, S-14, S-15 | RESPONSIVE_CONTRACT §5 |
| 7 | Student Insights (evidence) | S-16, S-17 | RESPONSIVE_CONTRACT §5 |
| — | Login | S-01 | RESPONSIVE_CONTRACT §5 |

## 2. Design decisions locked

- Palette, type, radii, spacing, icons: unchanged from `DESIGN_SYSTEM.md`. No new palette.
- One shell; templates differ by composition, not by styling.
- Attendance carries no dashboard cards; Fees carries no charts.
- Miso limited per `SCREEN_INVENTORY.md` §4.
- Faculty sees no fee data in UI; server enforces it (`AUTHORIZATION_DESIGN.md`).

## 3. Not done in Phase 3

- No Stitch mockups were generated here. Optional; run `STITCH_PROMPTS.md` §4 (Overview + Attendance mobile) if wanted. Any output is reference only.
- No Miso artwork produced. Needed before Phase 6 polish; placeholder-free: ship screens without Miso rather than fake art.
- No code. No component library installed.

## 4. Exit checklist

| Item | Status |
| --- | --- |
| Screen inventory complete and mapped to API | Done |
| Per-screen notes at six widths | Done |
| Seven templates assigned to every screen | Done |
| Miso allowed/forbidden list | Done |
| Owner approval of templates | **Pending** |

## 5. Next gate

Phase 4 (development environment) starts only when the owner says "start the development environment". It scaffolds `frontend/` and `backend/`, env examples, and a README for running both processes. No features.

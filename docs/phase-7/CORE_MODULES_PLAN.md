# CampusOS — Phase 7: Core ERP modules plan

**Objective:** wire the online happy path for directory, masters, attendance, marks and fees to the real API. Distinct templates, working forms, no dead buttons. Screens: `phase-3/SCREEN_INVENTORY.md`. Offline behaviour is Phase 8; the online Save path here must already use the same payload shape as `/attendance/sync`.

## 1. Build order
| Step | Module | Screens | Verification |
| --- | --- | --- | --- |
| 7.1 | Students | S-04, S-05, S-06 | search, batch filter, pagination, Faculty sees no fees, sample student row exact |
| 7.2 | Academics | S-07 | Admin CRUD per section; duplicate 409 shown inline; Faculty read-only |
| 7.3 | Attendance online | S-08, S-09, S-10 | pick session → roster → mark all present (unmarked only) → save only when complete; Admin correction requires reason |
| 7.4 | Marks | S-11, S-12 | inline max/negative validation; draft→submit→moderate→lock→unlock with audit rail; locked banner |
| 7.5 | Fees | S-13, S-14, S-15 | Decimal display; partial payment; overpay blocked; replay returns same receipt; "Simulated" on every amount |
| 7.6 | Overview + Audit | S-02, S-03, S-18 | role-shaped aggregates from `/overview`; audit read-only |

## 2. Rules
- Each module ships complete (list → action → feedback → error) before the next starts.
- Faculty and Admin journeys both exercised in Playwright against the real backend.
- Responsive contract verified per module at 1440, 1280, 1024, 768, 390, 360.
- No Miso in tables, fees, marks, audit.

## 3. Exit criteria
Admin and Faculty complete their online journeys end to end. Playwright journeys pass at desktop and 390. Attendance takes under 30 seconds once the roster is loaded (measured, not asserted).

## 4. Approval gates
None. If the deadline slips, follow the cut order in `phase-1/MVP_SCOPE.md` (P2 → AI explanation → Admin student CRUD → polish); never cut offline correctness, RBAC, marks lock or fee integrity.

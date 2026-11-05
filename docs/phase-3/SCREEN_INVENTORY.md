# CampusOS — Phase 3: Screen inventory

Locks every screen implementation will build. Visual tokens: `docs/DESIGN_SYSTEM.md`. Layout recomposition: `docs/RESPONSIVE_CONTRACT.md`. Data: `docs/phase-2/API_CONTRACT.md`. Nothing here adds scope beyond `phase-1/MVP_SCOPE.md`. If a screen has no working data source or action, it does not ship (no empty-theatre nav).

Roles: **F** Faculty · **A** Office Admin. Routes are frontend paths.

## 1. Navigation

| Item | Route | F | A | Template |
| --- | --- | --- | --- | --- |
| Overview | `/` | yes | yes | Editorial |
| Students | `/students` | yes (assigned, no fees) | yes | Directory |
| Academics | `/academics` | read of own assignments | yes | Settings |
| Attendance | `/attendance` | yes | review/correct | Task workspace |
| Marks | `/marks` | yes | yes | Spreadsheet |
| Fees | `/fees` | hidden, server 403 | yes | Ledger |
| Student Insights | `/insights` | hidden, server 403 | yes | Evidence |
| Audit | `/audit` | hidden | yes | Table (Students-style) |
| Login | `/login` | public | public | Login |

Faculty mobile bottom nav: Overview, Attendance, Marks, More. Admin mobile: header menu → sheet. Audit lives under Admin nav only (a seven-template product; Audit reuses the Students table pattern, not an eighth template).

## 2. Screens

| ID | Screen | Route | Role | Primary action | API | States to design |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | Login | `/login` | public | Sign in | Supabase Auth, `/auth/me` | idle, submitting, bad credentials, expired session, demo hint |
| S-02 | Overview (A) | `/` | A | Open attention item | `/overview` | loading skeleton, populated, all caught up |
| S-03 | Overview (F) | `/` | F | Start attendance | `/overview`, `/assignments` | no assignments, populated |
| S-04 | Student directory | `/students` | F, A | Open student | `/students` | loading, results, no match, error |
| S-05 | Student profile | `/students/[id]` | F, A | (A) Edit / Record payment link | `/students/{id}` | loading, populated, fees hidden for F, not found |
| S-06 | Student create/edit | `/students/new`, `/students/[id]/edit` | A | Save student | `/students` | validation, duplicate roll 409 |
| S-07 | Academics | `/academics` | A (F read) | Save section | masters endpoints | per-section empty, 409 duplicate |
| S-08 | Attendance — pick session | `/attendance` | F | Open roster | `/assignments`, `/attendance/sessions` | no assignment, already synced session |
| S-09 | Attendance — mark | `/attendance/session` | F | Save session | roster cache, `/attendance/sync` | online, offline, roster never cached, pending, syncing, synced, failed, conflict |
| S-10 | Attendance — review/correct | `/attendance/review` | A | Save correction | `/attendance/sessions`, correction | reason required |
| S-11 | Marks — component list | `/marks` | F, A | Open component | `/marks/components` | draft, submitted, moderated, locked |
| S-12 | Marks — grid | `/marks/[componentId]` | F, A | Submit / Moderate / Lock / Unlock | `/marks/components/{id}` | inline invalid, locked banner, audit rail |
| S-13 | Fees — ledger | `/fees` | A | Open account | `/fees/accounts` | loading, results, none |
| S-14 | Fees — account | `/fees/[studentId]` | A | Record payment | `/fees/accounts/{id}`, `/fees/payments` | outstanding 0, amount > outstanding, replay |
| S-15 | Receipt | sheet/panel on S-14 | A | Print / copy | `/fees/receipts/{id}` | simulated watermark |
| S-16 | Insights list | `/insights` | A | Open student | `/insights` | none flagged, populated |
| S-17 | Insight detail | `/insights/[studentId]` | A | Create mentor task | `/insights/students/{id}`, `/mentor-tasks` | explanation pending, available, unavailable (rules only), limited data |
| S-18 | Audit log | `/audit` | A | Filter | `/audit-events` | empty, populated |
| S-19 | Global states | — | all | — | — | 401 → login, 403 page, 404, offline banner, error boundary |

## 3. Cross-cutting components (one per concern)

SyncChip (binds to navigator + Dexie outbox), OfflineBanner, PageHeader, StatusPill, DataTable ↔ CardList switch, RosterRow (3 status buttons), SummaryStrip (money), AuditRail, ConfirmSheet/Dialog, Toast, EmptyState (Miso optional per rules), Skeletons per template.

## 4. Miso placement

Allowed: S-01, empty states (S-04 none, S-08 no assignment, S-16 none flagged, S-02 all caught up), offline banner illustration, first-sync success.
Forbidden: S-05 data blocks, S-12 grid, S-13/S-14 ledger and receipt, S-17 evidence, S-18 audit, any error state.

## 5. Open items (do not block Phase 4)

- Period labels (1–8) have no timetable mapping; show "Period n" only.
- Audit nav placement is a design call here; revisit only if the client objects.

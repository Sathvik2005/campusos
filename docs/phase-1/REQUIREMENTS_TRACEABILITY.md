# CampusOS — Phase 1: Requirements traceability

Client / BR → feature → story → AC → planned test.

| Client / BR | Feature | Story | AC | Planned test |
| --- | --- | --- | --- | --- |
| Sign-in, two roles | Auth | US-AUTH-01 | AC-AUTH-01 | Playwright login; Pytest token |
| Unauthenticated blocked | Auth | US-AUTH-02 | AC-AUTH-02 | HTTPX 401 |
| Faculty cannot admin | RBAC | US-AUTH-03 | AC-AUTH-03 | Pytest 403 matrix |
| Sign out | Auth | US-AUTH-04 | AC-AUTH-04 | Playwright logout |
| Visibility / reporting | Dashboard | US-DASH-01/02 | AC-DASH-01/02 | API aggregate tests |
| Academic configuration | Masters | US-MAS-01–03 | AC-MAS-01–03 | Pytest uniqueness + 403 |
| Student records | Directory | US-STU-01–05 | AC-STU-01–05 | Search + sample row test |
| Same-day attendance | Attendance | US-ATT-01–04 | AC-ATT-01–04 | Pytest session unique |
| Admin attendance fix | Attendance | US-ATT-05 | AC-ATT-05 | Audit test |
| Offline classroom | Offline | US-OFF-01–06 | AC-OFF-01–06 | fake-indexeddb + Playwright offline |
| Internals no retype | Marks | US-MRK-01–05 | AC-MRK-01–05 | Pytest lock + audit |
| Fee recon 10d→1d support | Fees | US-FEE-01–04 | AC-FEE-01–04 | Decimal + idempotency |
| At-risk students | Insights | US-RISK-01–06 | AC-RISK-01–06 | Rules unit + AI fail |
| Mobile + desktop | Responsive | US-NFR-01 | AC-NFR-01 | Playwright viewports |
| Honest UI | States | US-NFR-02 | AC-NFR-02 | Component tests |

Every **P0** story has an AC ID. Out-of-scope items (admissions, payroll, real gateway, parent portal) have **no** stories on purpose.

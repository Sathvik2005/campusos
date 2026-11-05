# CampusOS — Phase 1: Acceptance criteria

Given / When / Then for every story in `USER_STORIES.md`. P0 items must be automated or demoed before calling a module done.

---

### AC-AUTH-01
Given valid demo credentials, when the user submits login, then a session is established and they land on the role-correct overview.

### AC-AUTH-02
Given no token, when a protected API is called, then the response is 401.

### AC-AUTH-03
Given a Faculty token, when they POST fees, lock marks, or write masters, then the API returns 403 and the database is unchanged.

### AC-AUTH-04
Given an authenticated session, when the user signs out, then subsequent API calls are 401 until login.

### AC-DASH-01
Given Admin, when Overview loads, then student count, attendance today, outstanding dues, review list, and pending moderation come from APIs for the **seeded campus**, not hardcoded 7800 / ₹95cr figures.

### AC-DASH-02
Given Faculty, when Overview loads, then they see assignments and pending sync, and do not see fee ledgers.

### AC-MAS-01
Given a migrated+seeded database, when Admin opens Academics, then CSE programme, year 2 batch, subjects, and assignments exist.

### AC-MAS-02
Given Admin, when they create a duplicate faculty–subject–batch assignment, then the API rejects it (409/422).

### AC-MAS-03
Given Faculty assigned only to Subject A, when they list classes, then Subject B does not appear; requesting B’s roster returns 403.

### AC-STU-01
Given Admin, when they search a roll or name, then matching CSE students return paginated.

### AC-STU-02
Given the seed, when searching `ENG-24-CSE-0412`, then Subhashree Mohanty shows attendance 81.5%, internals 33/40, fee due ₹0.

### AC-STU-03
Given Admin, when they open a student profile, then identity, attendance %, internals, and outstanding display.

### AC-STU-04
Given Faculty, when they load a roster, then fees fields are absent from the payload.

### AC-STU-05
Given Admin, when they create a student with a duplicate roll, then 409/422.

### AC-ATT-01
Given Faculty and an assigned class, when they set Present/Absent/Late for all students and save online, then one session exists with those statuses.

### AC-ATT-02
Given an unmarked roster, when they Mark all present (fill unmarked) and save, then all students are Present and the action is completable in under 30s on a loaded roster.

### AC-ATT-03
Given an existing session for batch+subject+date+period, when Faculty saves again with a new idempotency key and different payload, then 409 and no second session.

### AC-ATT-04
Given a synced session, when Faculty PATCHes records, then 403/409 and data unchanged.

### AC-ATT-05
Given Admin and a reason, when they correct a synced status, then the record updates and an audit row exists.

### AC-OFF-01
Given a cached roster and offline browser, when Faculty saves a complete session, then IndexedDB contains the session and UI shows pending/offline.

### AC-OFF-02
Given pending local session, when the tab is refreshed or restarted, then the pending session is still present.

### AC-OFF-03
Given pending session and restored connectivity, when sync runs, then the server has one session and local status is synced.

### AC-OFF-04
Given the same idempotency key posted twice, then one session/records exist.

### AC-OFF-05
Given 5xx or 409 conflict, when sync fails, then local records remain and status is failed/conflict.

### AC-OFF-06
Given pending count > 0, when online, then the chip is not “All synced”; given `navigator.onLine` false, the chip is Offline even if a previous sync succeeded.

### AC-MRK-01
Given max 20, when Faculty enters 21 or −1, then validation fails and no row is stored.

### AC-MRK-02
Given draft with all students scored, when Faculty submits, then lifecycle is `submitted` and Faculty cannot edit.

### AC-MRK-03
Given submitted component, when Admin locks, then Faculty and Admin cannot change scores via normal update.

### AC-MRK-04
Given an Admin score change, when saved with reason, then audit stores old, new, actor, reason.

### AC-MRK-05
Given locked component, when Admin unlocks with reason, then state is `moderated` and Faculty still cannot edit.

### AC-FEE-01
Given payments P, plan T, then outstanding = T − P (numeric, INR).

### AC-FEE-02
Given amount > outstanding or ≤ 0, then 422; given same payment idempotency key twice, then one payment.

### AC-FEE-03
Given a successful mock payment, then a receipt with Simulated labelling exists.

### AC-FEE-04
Given Faculty, when they GET/POST fees, then 403.

### AC-RISK-01
Given attendance 68%, then shortage/watch or at_risk per PD-30; given 81.5% and 33/40, Subhashree is not at_risk.

### AC-RISK-02
Given no synced sessions, then confidence/insufficient is disclosed; no invented trend.

### AC-RISK-03
Given AI key and valid evidence, when explanation is requested, then text is stored as explanation only; category unchanged.

### AC-RISK-04
Given missing AI key or timeout, then category and evidence still return; explanation_status = unavailable.

### AC-RISK-05
Given Admin POST mentor task, then a task row exists; Faculty POST returns 403.

### AC-RISK-06
Given any AI code path, then it cannot INSERT/UPDATE marks, attendance, or payments.

### AC-NFR-01
Given 1440 and 390, primary routes have no `document.documentElement.scrollWidth > innerWidth` page overflow.

### AC-NFR-02
Given empty list, loading, and 500, the UI shows the matching state; no dead primary buttons.

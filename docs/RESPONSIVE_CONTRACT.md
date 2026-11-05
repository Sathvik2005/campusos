# CampusOS — Component responsive contract

This is the binding layout contract for every reusable component and page template.

**Rule:** Recompose. Do not scale.

Required QA widths: **1440, 1280, 1024, 768, 390, 360**.

Breakpoints (implementation):

| Name | Min width | Intent |
| --- | --- | --- |
| `base` | 0 | Mobile task UI (360–389, 390+) |
| `sm` | 640px | Large phones / small phablets |
| `md` | 768px | Tablet compact workspace |
| `lg` | 1024px | Small desktop, collapsible sidebar |
| `xl` | 1280px | Default desktop |
| `2xl` | 1440px | Spacious desktop |

No page-level horizontal overflow. Safe-area insets respected on iOS (`env(safe-area-inset-*)`). Minimum touch target **44 × 44 CSS pixels** unless the control is a dense marks cell *and* an adjacent mobile stepper exists.

---

## 1. Application shell

| Component | Desktop (≥1024) | Tablet (768–1023) | Mobile (<768) |
| --- | --- | --- | --- |
| **AppShell** | Persistent 240px midnight sidebar + 56px top bar + scrollable main | Collapsible sidebar (overlay + 72px rail optional). Top bar keeps campus + sync | No persistent sidebar. 52px header. Faculty: 64px bottom nav. Admin: header menu → full-screen sheet |
| **Sidebar** | Always visible | Hidden behind menu unless pinned | Not used; destinations live in sheet or bottom nav |
| **TopBar** | Title, breadcrumb, search (where useful), sync chip, avatar | Title + sync + avatar + menu | Title truncates. Sync chip always visible. Menu button 44px |
| **BottomNav** | Hidden | Hidden | Faculty only: Overview, Attendance, Marks, More. Labels + icons |
| **NavSheet** | Hidden | Primary mobile/tablet nav for Admin | Admin destinations + sign out |
| **Breadcrumbs** | Full | Parent + current | Current page title only |
| **PageHeader** | Title left, primary action right, filters in a second row | Same, action may wrap | Title stacked above full-width action |

---

## 2. Chrome and feedback

| Component | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| **SyncStatus** | Chip in top bar: Online / Offline / Pending n / Syncing / Synced / Failed | Same | Compact chip in header; Attendance also pins a 40px status bar under header so faculty never lose it |
| **OfflineBanner** | Full-width under top bar when offline | Same | Same, above bottom nav collision avoided (banner in flow, not overlaying roster actions) |
| **Toast** | Bottom-right, 360px | Bottom-center | Bottom, above bottom nav + safe area. One toast at a time |
| **Dialog** | Centered modal, max 480–640px | Same, slightly tighter | **Sheet** from bottom, 90vh max, drag handle, full-width buttons |
| **Confirm** | Dialog | Dialog | Sheet with stacked 44px actions |
| **Tooltip** | Hover | Hover if pointer | Do not rely on tooltip; use visible caption or status text |
| **DropdownMenu** | Right-aligned menu | Same | Full-width action sheet |

---

## 3. Forms and controls

| Component | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| **TextField / Password / Search** | 40px height, inline with filters | 40–44px | 44px, full width. `font-size ≥ 16px` to prevent iOS zoom |
| **Select / Period picker** | Native-styled select or popover | Same | Native select or sheet list, 44px rows |
| **DateField** | Date input | Same | Native date keyboard; never clip calendar off-screen |
| **Button** | 40px, hug content | 40px | 44px; primary actions full width in forms |
| **IconButton** | 36–40px | 40px | 44px hit area (visual icon may be 20px) |
| **Segmented control** (Present/Absent/Late) | Compact 32–36px in dense optional desktop | 40px | **44–48px** per segment; three equal columns |
| **Mark all present** | Secondary button in toolbar | Same | Sticky footer action, 44px, not competing with bottom nav (Attendance uses custom footer; hide Faculty bottom nav **or** lift footer above it) |
| **Checkbox / Switch** | 16px visual, 24px hit | 44px hit | 44px hit |
| **FilterBar** | Horizontal chips + search | Wrap | Search full width; filters in a “Filters” sheet |

---

## 4. Data display

| Component | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| **DataTable** | Full columns, sticky header, 48px rows, horizontal **table** scroll only as last resort inside card | Fewer columns; optional horizontal scroll **inside** table container, never page | **Replace table** with list/cards. No page overflow |
| **StudentDirectoryTable** | Roll, name, programme/year, attendance %, internals, dues, action | Hide programme column | **StudentCard**: name + roll, three metrics row, tap → detail |
| **MarksGrid** | Spreadsheet: frozen name column, component columns | Frozen name + one component at a time if needed | One component at a time. Each student: name, numeric field 44px, validation inline |
| **FeeLedger** | Columns: date, receipt, amount, method, status | Same, compact | Timeline cards: amount hero, date, simulated badge |
| **AuditList** | Side panel 320px | Stack below grid | Accordion under page, not a cramped side panel |
| **MetricCard** | 4-up grid | 2-up | 2-up (360px: still 2-up with smaller type, not 4-up) |
| **AttentionList** | Two-column with activity | Stack | Stack; 44px “Review” |
| **EmptyState** | Centered, Miso 120–160px, one action | Same | Miso ≤ 120px, copy shorter, action full width |
| **Skeleton** | Mirrors template | Mirrors | Mirrors (roster bars, not desktop table) |
| **Receipt** | A5-like panel | Same | Full width, print via browser share |

---

## 5. Template compositions

### Overview

| Width | Composition |
| --- | --- |
| 1440 / 1280 | Greeting + 4 metrics + attention + activity two-column |
| 1024 | Metrics 2×2, stacks below |
| 768 | Same as 1024, sidebar collapsed |
| 390 / 360 | Greeting, 2×2 metrics, attention, activity. No charts required |

### Students

| Width | Composition |
| --- | --- |
| ≥1024 | Search/filter toolbar + table + optional detail drawer 420px |
| 768 | Toolbar wraps; table with fewer columns |
| ≤390 | Search, filter button, card list. Detail is a full-screen route |

### Academics

| Width | Composition |
| --- | --- |
| ≥1024 | Left section nav or stacked cards in a 2-column settings layout |
| ≤768 | Single column accordion sections; forms full width |

### Attendance (highest priority)

| Width | Composition |
| --- | --- |
| ≥1280 | Left: class/session context (280px). Right: roster with inline status controls |
| 1024 / 768 | Context as compact header; roster full width |
| ≤390 | Header: subject, period, date, sync. Roster: name + three large status buttons. Sticky save. **No metric cards.** One-handed: primary actions in lower half. Mark All Present reachable without scrolling past entire roster (toolbar under header **and** duplicated in sticky footer) |

**30-second path:** session already selected → roster visible → Mark all present **or** per-student taps → Save. Offline must not add extra steps.

### Marks

| Width | Composition |
| --- | --- |
| ≥1280 | Toolbar + grid + audit rail |
| 768–1024 | Grid full width; audit below |
| ≤390 | Component picker, then per-student stepper list. Locked state banner at top |

### Fees

| Width | Composition |
| --- | --- |
| ≥1024 | Summary strip (total / paid / outstanding) + search + ledger table + receipt panel |
| ≤768 | Summary stacked, search, payment CTA, card timeline. Receipt as sheet |

### Student Insights

| Width | Composition |
| --- | --- |
| ≥1024 | Flagged table/list left, evidence panel right |
| ≤768 | List first; evidence is a drill-in page. Supportive color, not red wash |

### Login

| Width | Composition |
| --- | --- |
| ≥1024 | Memorable **asymmetric** layout (not a generic 50/50 split-screen cliché). Form + Miso editorial panel |
| ≤768 | Centered form, Miso small above wordmark. Demo account hint visible without scrolling past fold if possible |

---

## 6. Attendance mobile specifics

Faculty on 360–390px is the client’s most important everyday interaction.

1. Bottom navigation may hide on the live marking view so the sticky Save/Mark-all bar has exclusive thumb space. Provide a clear back control in the header.
2. Status buttons: Present, Absent, Late each ≥44px high.
3. Student name `body-lg`, roll `caption`.
4. Sync status visible while scrolling (sticky).
5. Failed sync: retry on the record/session, local data retained.
6. Do not use desktop-style checkboxes as the primary mark control.

---

## 7. Accessibility at every breakpoint

- Focus ring: 2px lilac on light, cream on midnight sidebar.
- Contrast AA for text and buttons.
- Sync status has text, not color alone.
- Keyboard: desktop tables, dialogs, attendance controls.
- Reduced motion: skip translate animations.

---

## 8. QA checklist (design acceptance)

Copy of the product checklist — all must pass before calling UI done:

- [ ] Desktop dashboard looks polished (1440 and 1280)
- [ ] Tablet navigation works (768)
- [ ] Mobile dashboard works at 390px
- [ ] Mobile dashboard works at 360px
- [ ] Student directory has a mobile layout
- [ ] Attendance can be marked comfortably on mobile
- [ ] Offline and sync states are visible
- [ ] Marks entry has a distinct layout
- [ ] Fee ledger has a distinct layout
- [ ] Academic masters has a distinct layout
- [ ] No horizontal page overflow
- [ ] All buttons and controls work
- [ ] Miso illustrations are restrained and consistent
- [ ] Loading, empty and error states are implemented

Capture screenshots of final desktop and mobile screens at those widths.

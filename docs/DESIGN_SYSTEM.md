# CampusOS — Design system

**Working title:** Editorial SaaS, not college ERP.  
**Principle:** One product. One visual identity. Different layouts for different jobs.  
**Mascot:** Miso — a small campus companion, never a decoration layer.

This document is the visual source of truth for implementation. Stitch mockups are references; they do not override these tokens or template rules.

---

## 1. Brand

| Name | Role | Hex |
| --- | --- | --- |
| Midnight | Primary dark, type, sidebar | `#111827` |
| Paper | Warm canvas | `#F5F3EF` |
| Lilac | Signature accent | `#C4B5FD` |
| Mint | Positive status | `#D1FAE5` |
| White | Surfaces | `#FFFFFF` |

Derived tokens (implementation):

| Token | Value | Use |
| --- | --- | --- |
| `--bg-canvas` | `#F5F3EF` | App background |
| `--bg-surface` | `#FFFFFF` | Cards, tables, sheets |
| `--bg-sidebar` | `#111827` | Desktop navigation |
| `--bg-sidebar-hover` | `#1F2937` | Sidebar item hover |
| `--text-primary` | `#111827` | Headings, body |
| `--text-muted` | `#6B7280` | Meta, timestamps |
| `--text-on-dark` | `#F9FAFB` | Sidebar text |
| `--border-subtle` | `#E7E5E4` | Card and table borders |
| `--accent` | `#C4B5FD` | Focus, selected, links on light |
| `--accent-strong` | `#7C3AED` | Primary button fill (calibrated for contrast) |
| `--navy` | `#111827` | Secondary buttons, emphasis |
| `--positive-bg` | `#D1FAE5` | Present, paid, synced |
| `--positive-fg` | `#065F46` | Text on mint |
| `--warning-bg` | `#FEF3C7` | Late, watch, pending |
| `--warning-fg` | `#92400E` | Warning text |
| `--danger-bg` | `#FEE2E2` | Critical errors only |
| `--danger-fg` | `#991B1B` | Error text |
| `--offline-bg` | `#111827` | Offline strip |
| `--offline-fg` | `#F5F3EF` | Offline strip text |

**Accent usage:** Lilac is a signature, not a flood fill. Prefer navy buttons for primary academic actions; lilac for selected states, focus rings, and brand moments (login, empty states).

If contrast fails WCAG AA, darken `--accent-strong` rather than abandoning the palette.

---

## 2. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Headings | Manrope | 600–700. Tracking slightly tight on large titles. |
| Body / UI | Inter | 400–500. Default 14–16px. |
| Numbers | Inter with `font-variant-numeric: tabular-nums` | Fees, %, marks, roll suffixes |

Scale:

| Token | Size / line | Use |
| --- | --- | --- |
| `display` | 32/40 | Login, rare editorial titles |
| `h1` | 24/32 | Page titles |
| `h2` | 18/26 | Section titles |
| `h3` | 16/24 | Card titles |
| `body` | 14/22 | Default |
| `body-lg` | 16/24 | Mobile body, attendance names |
| `caption` | 12/16 | Meta, timestamps |
| `metric` | 28/32 tabular | Dashboard numbers |

No slang in financial or academic records. Product copy examples:

| Situation | Copy |
| --- | --- |
| Empty attendance | No attendance yet. Let's get this class rolling. |
| Offline | You're offline. Your work is safe on this device. |
| Sync complete | All caught up. Nice work. |
| Empty students | No students here yet. |
| Marks locked | Assessment secured. Changes are now restricted. |
| Fee payment | Payment recorded in demo mode. |

---

## 3. Layout tokens

| Token | Value |
| --- | --- |
| Radius | 10px components, 12px cards, 14px sheets / large surfaces |
| Border | 1px `--border-subtle` |
| Shadow | `0 1px 2px rgba(17,24,39,0.04)` only. No stacked glow. |
| Space scale | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Content max | 1200px for operational pages; 1440px shell |
| Sidebar width | 240px expanded, 72px icon collapsed |
| Top bar | 56px desktop, 52px mobile |
| Bottom nav | 64px (safe-area aware) |
| Touch min | 44 × 44 CSS px |

**Animation:** 150–200ms opacity/transform only. No layout bounce. Respect `prefers-reduced-motion`.

**Icons:** Lucide, 1.5–1.75 stroke, 16px in tables, 20px in nav, 24px in attendance actions.

---

## 4. Components

### Buttons

- **Primary:** Midnight fill, white label. Used for Save session, Record payment, Lock marks.
- **Accent:** Lilac/strong violet only for brand CTAs (Sign in, Get started).
- **Secondary:** White, 1px border, midnight label.
- **Ghost:** No border, muted hover.
- **Destructive:** Text or outline; solid red only for irreversible confirmations.
- Height 40px default, 44px on mobile / attendance.
- Labels are verbs: Mark all present, Submit for moderation, Record payment. No generic “Submit” on flagship flows.
- Loading replaces label with spinner + unchanged width to avoid layout shift.

### Inputs

- 40px height desktop, 44px mobile.
- 10px radius, 1px border, lilac focus ring 2px.
- Labels always visible (not placeholder-only).
- Validation message below field, not tooltip-only.
- Number inputs use tabular numerals; marks fields reject > max immediately.

### Tables

- Compact but spacious rows: 48px desktop.
- Sticky header.
- Hairline row borders, no zebra unless needed for dense marks grid.
- Numeric columns right-aligned.
- No cat illustrations in or beside tables.
- Mobile: **do not shrink columns**. Switch to the template’s list/card pattern. See responsive contract.

### Status indicators

Pills, 20–24px height, not giant badges.

| Status | Treatment |
| --- | --- |
| Present / Paid / Synced / Locked | Mint background, dark green text |
| Late / Pending / Watch | Amber |
| Absent / Failed / At risk | Neutral dark or restrained red — never alarm-red dashboards |
| Offline | Midnight strip, persistent |
| Demo payment | Caption “Simulated” always visible |

### Sidebar (desktop)

- Midnight background.
- Wordmark: **campusOS** in Manrope, small tagline optional.
- Active item: lilac tint bar + slightly lighter surface.
- Short list: Overview, Students, Academics, Attendance, Marks, Fees, Student Insights.
- Footer: user name, role, campus, sign out.
- Faculty: hide Admin-only items in UI **and** deny on server.

### Top bar

- Page title + breadcrumb.
- Campus context (seeded campus name).
- Online/offline + pending count (always real).
- Profile menu.

### Mobile navigation

- Faculty: bottom nav — Overview, Attendance, Marks, More.
- Admin: compact header + sheet menu (Admin has more destinations; bottom nav would overflow).
- Active state uses lilac, not a second color system.

### Empty / loading / error

- Empty: one Miso illustration (small), one sentence, one action.
- Loading: skeleton matching the template (table skeleton vs roster skeleton). No random spinners blocking the whole app except first auth.
- Error: plain language, retry where safe. **No Miso on critical errors.**
- Success: toast or inline confirmation. Miso allowed only for non-financial, non-academic-record successes (e.g. first sync).

---

## 5. Miso — cat identity rules

Miso is a sophisticated black campus cat: calm, curious, editorial line art or refined vector. Charcoal + cream + muted lilac. Consistent set of poses, not mixed stock images.

**Allowed:** login, onboarding, empty states, offline illustration, friendly success.

**Forbidden:** dense tables, fee ledgers, marks grids, audit logs, critical errors, risk evidence panels.

Three rules:

1. Cats belong in onboarding, empty states and friendly feedback.
2. Never place illustrations in dense operational tables or around sensitive data.
3. Use one illustration style.

---

## 6. Seven page templates

Do not reuse the Overview card grid on every route.

| Module | Template | First impression |
| --- | --- | --- |
| Overview | Editorial dashboard: greeting, date, 4 metrics, attention list, activity | Calm and informative |
| Students | Search-first directory | Find someone in two seconds |
| Academics | Settings / configuration workspace | Structured sections |
| Attendance | Full-width task workspace | Roster + actions dominate |
| Marks | Spreadsheet-inspired assessment | Fast valid entry |
| Fees | Financial ledger | Amounts and history, not charts |
| Student Insights | Evidence workspace | Supportive, not alarming |

### Overview

Greeting (“Good morning, Admin.”), current date, campus context. Metrics: students, attendance today, outstanding dues, students to review. Attention list (below 75%, marks awaiting moderation). Recent activity. **Illustrative dashboard numbers in mockups are not client KPIs.**

### Students

Search + batch/programme filters. Desktop table. Mobile cards. Detail drawer/page with attendance, marks, fees.

### Academics

Stacked sections: programme, year, batch, subjects, faculty, assignments, calendar. Simple forms. No marketing hero.

### Attendance (flagship)

No dashboard cards. Immediate class, subject, period, date. Roster with Present / Absent / Late. Mark all present. Completion indicator. Persistent sync status. 30-second path once roster is loaded.

### Marks

Component selector, max marks, inline validation, draft / submitted / moderated / locked. Audit panel. Faculty cannot edit locked values.

### Fees

Total / paid / outstanding hierarchy. Search. History. Mock payment. Receipt. Every amount labelled demo where simulated.

### Student Insights

Flagged students, evidence, explanation, confidence, mentor task. No frightening red-heavy visuals.

---

## 7. Visual layers

1. **Structure** — shell, nav, breadcrumbs, titles  
2. **Information** — tables, metrics, filters, status  
3. **Personality** — Miso, empty copy, occasional warmth  

Personality never covers information.

---

## 8. Anti-patterns

- Generic blue ERP cards
- Glassmorphism
- Neon / rainbow charts
- Same card layout on every page
- Oversized decorative cats
- Dead buttons
- Fake offline badges
- Emoji in ledgers
- Horizontal overflow
- Shrinking desktop tables onto 360px screens

---

## 9. Implementation mapping

- Tailwind theme extends these tokens.
- shadcn/ui primitives restyled to Paper / Midnight / 10–14px radius.
- Fonts via `next/font` (Manrope + Inter).
- Component responsive behavior: `docs/RESPONSIVE_CONTRACT.md`.

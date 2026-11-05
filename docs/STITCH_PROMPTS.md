# CampusOS — Google Stitch prompts

Optional visual exploration. Stitch output is **reference only**. Implementation follows `DESIGN_SYSTEM.md` and `RESPONSIVE_CONTRACT.md`.

**Generation order (do not dump all screens in one run):**

1. Design system + Admin Overview  
2. Attendance desktop + mobile (stop and review)  
3. Student directory + academic masters  
4. Marks  
5. Fees + Student Insights  
6. Consistency pass

Share Overview + mobile Attendance for review before generating the rest.

---

## 1. Master UI/UX prompt

```
PROJECT: CAMPUSOS
Complete Product UI/UX Design System and Application
Act as an award-winning Senior Product Designer, SaaS Design Lead and UX Architect.

Design a complete, high-fidelity, responsive academic operations SaaS application named CAMPUSOS.

This is a real product design exercise for a Software Engineering Intern take-home assignment at Isocode Labs.

The application must look polished enough to be demonstrated to an enterprise client and evaluated by senior software engineers.

IMPORTANT: Do not create a generic college ERP dashboard.

Create a distinctive product with a consistent design language, carefully designed workflows, excellent information hierarchy and genuinely useful interactions.

==================================================
1. PRODUCT IDENTITY
==================================================
Product name: CampusOS
Tagline: Campus life, in sync.
Product category: Academic Operations Management SaaS.
Client: Company A, Bhubaneswar.

The client operates three colleges with:
- 7,800 students.
- 520 teaching staff.
- 340 non-teaching staff.
The existing system relies on paper registers, Excel spreadsheets and an outdated desktop application.

CampusOS aims to unify academic records, attendance, internal marks and fee management.

Initial prototype scope:
- One campus.
- One programme: B.Tech CSE.
- Two user roles: Faculty and Office Admin.
The defining product feature is offline-first attendance.

Product promise:
"Campus operations continue, even when the internet doesn't."

The design must be:
- Minimal but not boring.
- Professional but not corporate-heavy.
- Youthful but not childish.
- Modern and distinctive.
- Calm and focused.
- Premium and approachable.
- Functional before decorative.

Design inspiration:
- Linear: navigation and information hierarchy.
- Notion: clarity and workspace organization.
- Modern fintech: financial data presentation.
- Editorial web design: personality and whitespace.
Do not copy these products directly.
Create an original CampusOS visual identity.

Initial color palette:
MIDNIGHT #111827
PAPER #F5F3EF
LILAC #C4B5FD
MINT #D1FAE5
WHITE #FFFFFF

Use:
- Warm neutral backgrounds.
- White content surfaces.
- Dark navy typography.
- Muted lavender accents.
- Soft green for positive states.
- Restrained amber for warnings.
- Clear red only for critical errors.

Typography:
- Manrope for headings.
- Inter for body text.
- Tabular numbers for financial and academic values.

Design characteristics:
- 10–14px component corner radius.
- Thin, subtle borders.
- Very restrained shadows.
- Consistent spacing scale.
- Clean iconography.
- Lucide-style icons.
- Strong visual hierarchy.

Avoid:
- Excessive gradients.
- Glassmorphism.
- Neon colors.
- Excessive rounded cards.
- Giant decorative graphics.
- Unnecessary charts.
- Random colors.
- Excessive animation.
- Generic admin templates.

Create a subtle professional cat mascot named Miso.
Miso is a sophisticated black cat with a calm, curious personality.
Illustration direction:
- Minimal line art or refined editorial vector.
- Black and charcoal tones.
- Warm cream and muted lavender accents.
- Clean silhouette.
- Consistent visual style.
Use Miso selectively:
- Login illustration.
- Empty states.
- First-time onboarding.
- Offline-state illustration.
- Friendly success messages.
Do not use cats in dense academic tables, financial data, marks entry or critical warnings.

Design a responsive application shell.

DESKTOP:
- Left navigation sidebar.
- CampusOS logo and identity.
- Main page content.
- Compact top bar.
- Search where useful.
- Notifications.
- User profile.
- Campus context.
Sidebar navigation:
1. Overview
2. Students
3. Academics
4. Attendance
5. Marks
6. Fees
7. Student Insights
Keep the navigation short and meaningful.

MOBILE:
- Compact header.
- Bottom navigation or compact navigation drawer.
- Single-column page layouts.
- Large touch targets.
- No horizontal overflow.
- Mobile-friendly forms and dialogs.

TABLET:
- Collapsible sidebar.
- Compact navigation.
- Adapted tables and dashboards.

SCREEN 01 — LOGIN
Create an elegant login page.
Include: CampusOS logo, tagline, email, password, sign-in button, demo account hint, professional Miso illustration.
Avoid a generic split-screen template.
Make the login page visually memorable but minimal.

SCREEN 02 — ADMIN DASHBOARD
Create a refined administrative overview.
Include: greeting, current date, campus context, total students, attendance percentage, outstanding fee amount, students needing attention, recent activity, marks awaiting moderation.
Use meaningful metrics, not decorative cards.
Numbers are illustrative UI, not real client KPIs.

SCREEN 03 — STUDENT DIRECTORY
Professional student management workspace.
Include: search, programme filter, batch filter, roll number, name, attendance percentage, internal marks, outstanding fee, student detail access.
Compact readable tables on desktop. Student cards or responsive list on mobile.

SCREEN 04 — ACADEMIC MASTERS
Configuration workspace: programme, academic year, batch, subjects, faculty, faculty assignments, academic calendar.
Clear sections and practical creation forms.

SCREEN 05 — ATTENDANCE (MOST IMPORTANT)
Design mobile-first. Faculty must mark a normal class in under 30 seconds when the roster is already loaded.
Include: class name, subject, academic year, date, period, student roster, Present, Absent, Late, Mark All Present, completion indicator, save.
Offline states: Online, Offline, Pending synchronization, Synchronizing, Successfully synchronized, Synchronization failed.
Persistent clearly visible synchronization status.
Large touch-friendly controls.
Do not overload with dashboard cards. Roster and actions dominate.

SCREEN 06 — INTERNAL MARKS
Spreadsheet-inspired assessment workspace: subject, component, maximum marks, roster, entry, validation, draft/submitted/moderation/locked, audit history.

SCREEN 07 — FEE MANAGEMENT
Financial ledger: total, paid, outstanding, search, payment history, mock payment, receipt, status.
Clear amount hierarchy. Not an analytics dashboard. Label payments as demo/simulated.

SCREEN 08 — STUDENT INSIGHTS
Explainable risk monitoring: flagged students, attendance trends, internals trends, risk category, evidence, AI explanation, confidence/data sufficiency, create mentor task.
Do not use frightening red-heavy visuals. Supportive and evidence-based.

Adapt every screen for desktop 1440 / 1280 / 1024, tablet 768, mobile 390 and 360.
No horizontal page overflow. Minimum 44px touch targets where practical.
Do not simply shrink desktop designs. Recompose layouts.
All buttons must have a meaningful intended behavior.

Copy:
Dashboard: "Good morning, Admin."
Offline: "You're offline. Your work is safe on this device."
Sync success: "All caught up. Nice work."
Empty attendance: "No attendance yet. Let's get this class rolling."
Marks: "Assessment secured. Changes are now restricted."
Fees: "Payment recorded in demo mode."

Generate:
1. Complete CampusOS design system.
2. Desktop application shell.
3. Mobile application shell.
4. Admin dashboard.
5. Faculty dashboard.
6. Student directory.
7. Academic masters.
8. Attendance desktop screen.
9. Attendance mobile screen.
10. Internal marks screen.
11. Fee management screen.
12. Student insights screen.
13. Login page.
14. Empty states and error states.
15. Reusable component patterns.

The design will later be implemented in Next.js, TypeScript, Tailwind CSS and shadcn/ui.
Use practical layouts. Do not sacrifice functionality for visual novelty.

FINAL DESIGN PHILOSOPHY:
One product. One visual identity. Different layouts for different jobs.
CampusOS should feel like a product people genuinely enjoy using every day.
Campus life, in sync.
```

---

## 2. Mobile addendum (append to every Stitch run)

```
Mobile Responsiveness & Adaptive UI

Make every CampusOS screen fully responsive and mobile-first. Design polished layouts for desktop (1440px), tablet (768px), and mobile (390px and 360px).
- Reorganize layouts for smaller screens instead of simply shrinking desktop designs.
- Use a compact top bar and clean bottom navigation or collapsible menu.
- Convert wide tables into readable cards or mobile-friendly lists.
- Make forms, filters, dialogs, charts, and dashboards comfortable to use on touchscreens.
- Keep buttons and touch targets at least 44px.
- Prioritize quick actions: especially marking attendance in under 30 seconds.
- Prevent horizontal scrolling, clipped content, and overlapping elements.
- Give each page its own thoughtful layout while maintaining consistent CampusOS branding.
- Preserve the minimal, premium, Gen-Z-friendly aesthetic, subtle cat mascot details, whitespace, and clear typography.
Important: Mobile should feel like a deliberately designed product experience, not a compressed desktop website.

Component-level behavior:
- App shell: sidebar on desktop, collapsible on tablet, header + Faculty bottom nav / Admin menu sheet on mobile.
- Tables become cards/lists below 768px. Never page-level horizontal scroll.
- Dialogs become bottom sheets on mobile.
- Attendance: sticky sync status, 44px Present/Absent/Late, sticky save, no dashboard cards.
- Marks: one assessment component at a time on mobile.
- Fees: amount summary stacked, ledger as timeline cards.
- Metric cards: 4-up desktop, 2-up tablet/mobile.
- Font size on inputs ≥ 16px on iOS to avoid zoom.
```

---

## 3. Consistency follow-up

```
Review all existing CampusOS screens as one unified product.

Do not redesign everything from scratch.

Identify and fix inconsistencies in:
- Sidebar dimensions.
- Header layout.
- Typography.
- Color usage.
- Spacing.
- Border radius.
- Table styling.
- Button styles.
- Status badges.
- Form controls.
- Mobile navigation.

Ensure that each module retains its own appropriate layout.
The dashboard should remain an overview.
Attendance should remain a task-first mobile workspace.
Marks should remain an assessment workspace.
Fees should remain a financial ledger.
Student Insights should remain an evidence-based monitoring workspace.

Unify the design language without making every page look identical.
Verify the 390px mobile layouts and 1440px desktop layouts.
Preserve the CampusOS identity and restrained Miso cat illustrations.
```

---

## 4. First two screens only (recommended first Stitch job)

```
Generate ONLY these CampusOS screens, using the CampusOS identity (Paper #F5F3EF, Midnight #111827, Lilac #C4B5FD, Mint #D1FAE5, Manrope + Inter, Miso the restrained black cat):

1) Design system fragments + Admin Overview (desktop 1440 and mobile 390). Editorial, four metrics, attention list, activity. Illustrative numbers only.
2) Attendance workspace desktop 1440 AND mobile 390. Task-first. No dashboard cards. Roster + Present/Absent/Late + Mark all present + persistent sync status. 44px touch targets on mobile.

Stop. Do not generate other modules yet.
```

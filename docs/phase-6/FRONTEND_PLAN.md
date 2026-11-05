# CampusOS — Phase 6: Frontend foundation plan

**Objective:** shell, tokens, API client, login, routing and responsive chrome against the real FastAPI. Module screens come in Phase 7. Design sources: `DESIGN_SYSTEM.md`, `RESPONSIVE_CONTRACT.md`, `phase-3/`.

## 1. Build order
| Step | Work | Verification |
| --- | --- | --- |
| 6.1 | Tailwind theme from design tokens; Manrope + Inter via `next/font`; shadcn primitives restyled (radius 10/12/14, lilac focus ring) | token snapshot; contrast check on `--accent-strong` |
| 6.2 | Typed `lib/api` client (Bearer token; error envelope mapping 401 → login, 403, 409, 422); TanStack Query provider | Vitest with mocked fetch |
| 6.3 | Supabase Auth client (session only, never mutations); `/login` (S-01); route guard; logout; expired-session handling | Playwright against the real backend: valid, invalid, expired, logout |
| 6.4 | AppShell: sidebar (≥1024), collapsible (768), 52px header + bottom nav for Faculty and sheet menu for Admin (<768); role-based nav | Playwright at 1440/1024/768/390/360: no horizontal overflow |
| 6.5 | Chrome: PageHeader, SyncChip (bound to `navigator.onLine` only until Phase 8; no fake pending counts), OfflineBanner, Toast, Dialog↔Sheet, StatusPill | component tests |
| 6.6 | States: skeletons per template, EmptyState, error boundary, 403/404 pages | component tests |
| 6.7 | Miso assets for login, empty and offline states (owner-supplied; if absent, ship without) | visual check, alt text |
| 6.8 | Seven template routes showing real empty states fed by real API calls (no fake numbers) | every nav item reaches a working page |

## 2. Rules
- No page talks to Postgres; all data goes through FastAPI. Tokens are never stored in IndexedDB.
- No decorative sync indicator: the chip reads real state or is hidden until Phase 8.
- 44px touch targets, always-visible labels, visible focus.
- No dead buttons: controls without a working action are not rendered.

## 3. Exit criteria
Login and an authenticated empty shell work at 1440 and 390 (also checked at 1280, 1024, 768 and 360) against a locally running backend with a real session. Lint, typecheck, Vitest and Playwright smoke tests pass.

## 4. Approval gates
None beyond owner-supplied local credentials. No deployment.

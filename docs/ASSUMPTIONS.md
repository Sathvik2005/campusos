# CampusOS — Assumptions, constraints and open decisions

This document records what we are treating as true so implementation can proceed without silently inventing product policy.

---

## 1. Confirmed product assumptions

1. The first release operates on **one campus**.
2. **B.Tech CSE** is the initial programme.
3. The initial batch is **second year**.
4. Faculty assignments are **seeded** for the prototype.
5. Mock payments **do not transfer money**. Every transaction is labelled simulated.
6. The initial AI assessment uses **synthetic data**.
7. Historical trends **may be synthetically seeded** for demonstration.
8. The deployed prototype uses **test accounts**.
9. Full parent consent and institutional DPDP workflows are **outside** prototype scope and must not be represented as fully implemented.
10. Sample student **Subhashree Mohanty / ENG-24-CSE-0412** must appear exactly as specified. All other identities are fictional.
11. Offline-first attendance is a **product identity feature**, not an optional enhancement.
12. Technical correctness of sync, auth, RLS and marks locking outranks visual polish.

---

## 2. Technical assumptions

| Topic | Assumption |
| --- | --- |
| Stack | Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase PostgreSQL + Auth + RLS |
| Offline | Dexie.js on IndexedDB, client-generated idempotency keys |
| Validation | Zod on client and server |
| Tests | Vitest for unit/integration, Playwright for critical journeys |
| Hosting | Vercel |
| Architecture | Simple modular monolith. No microservices. |
| Auth | Email/password demo accounts. No SSO in v1. |
| Timezone | Asia/Kolkata for campus dates and attendance sessions. |
| Currency | INR, displayed with Indian grouping and tabular numerals. |
| AI provider | One server-side provider via env secret. Fail closed to deterministic rules. |
| Secrets | `.env.local` only. Never committed. |

---

## 3. Design assumptions

1. Brand palette (Midnight, Paper, Lilac, Mint) is the **working** system, not a locked brand book. Small calibration is allowed if contrast fails WCAG.
2. Mascot name is **Miso** until changed. The illustration style is editorial line/vector, not cartoon sticker packs.
3. One visual identity, **seven page templates**. Sharing tokens is required; cloning dashboard cards onto every page is forbidden.
4. Admin is **desktop-first**. Attendance is **mobile-first**. Both must still work on the other class of device.
5. Stitch (or any generated mock) is a **visual reference**, not source of truth. Implementation follows this repo's design system and responsive contract.

---

## 4. Data and ethics constraints

- No real student PII beyond the single named sample record provided by the client brief.
- No claim that CampusOS is DPDP-complete.
- No claim that fee payments are real.
- No claim that AI “detects at-risk students” as an authority. AI explains; rules decide.
- Demo metrics on Overview must be labelled as live prototype data from the seeded campus, not Company A’s three-college totals.

---

## 5. Open decisions (do not block Phase 0)

These can be resolved during implementation without changing the PRD:

| ID | Question | Default if unresolved |
| --- | --- | --- |
| D-01 | Miso illustration source (custom SVG vs generated assets) | Hand-authored SVG set in `/public/miso` |
| D-02 | Faculty Overview vs Admin Overview | Two compositions, shared shell |
| D-03 | Bottom nav vs drawer on mobile for Admin | Bottom nav for Faculty attendance-heavy use; Admin uses header + sheet menu |
| D-04 | Exact attendance late threshold copy | Status is Late; no institutional penalty logic in v1 |
| D-05 | Internal marks components | Two seeded components (e.g. IA-1, IA-2) totalling 40 |
| D-06 | Risk thresholds | Attendance < 75% watch; < 65% at-risk; internals < 40% of max at-risk |
| D-07 | Seed volume | ~48–80 students so tables and mobile lists feel real |

---

## 6. Explicit non-goals (do not implement accidentally)

- Real Razorpay / Stripe / UPI capture
- WhatsApp or SMS dispatch
- Multi-campus switcher as a production feature (campus is seeded, not a platform admin console)
- Parent login
- Timetable generator
- NLP campus assistant in the critical path
- Claiming NAAC / AICTE compliance

---

## 7. Risk register (product / delivery)

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Offline sync duplicates or drops records | Assignment failure | Idempotency keys, unique constraints, replay-safe queue, tests before polish |
| RLS holes between Faculty and Admin | Security fail | Policy tests; deny-by-default |
| AI invents student facts | Trust fail | Zod schema, evidence-only prompts, fallback copy |
| Responsive tables overflow | Client design fail | Per-template mobile alternatives in responsive contract |
| Scope creep (three campuses, admissions, chat) | Missed deadline | PRD exclusions; Day 3 is tests + deploy |
| Decorative cats in operational UI | Unprofessional | Miso placement rules in design system |
| Fake offline badge | Integrity fail | Status driven only by real navigator + queue state |

---

## 8. Approval gate

Phase 1 implementation (design system in code + screens) starts only after explicit approval of:

1. This assumptions set
2. `docs/PRD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE_DESIGN.md`
5. `docs/DESIGN_SYSTEM.md`
6. `docs/RESPONSIVE_CONTRACT.md`
7. `docs/IMPLEMENTATION_PLAN.md`

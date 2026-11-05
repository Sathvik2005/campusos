# Responsive QA report

| Width | Login page (Playwright, real browser) | Authenticated screens |
|---|---|---|
| 1440 | PASS no horizontal overflow | NOT TESTED |
| 1280 | PASS | NOT TESTED |
| 1024 | PASS | NOT TESTED |
| 768 | PASS | NOT TESTED |
| 390 | PASS, tap targets >= 44 px | NOT TESTED |
| 360 | PASS | NOT TESTED |

Authenticated screens could not be opened (no Supabase credentials), so none of the eight modules has been checked at these widths in a browser. Design intent: tables are wrapped in `overflow-x-auto` (scroll inside the card, not the page); students, marks list, audit and attendance use list/card layouts; the sync chip is in the header on every width; faculty get a bottom nav under 768 px.
Known risk to check first once login works: the Fees and Marks tables at 360 px (scroll vs card), and the sticky attendance Save bar over the bottom nav.

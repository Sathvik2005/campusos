# Accessibility report

Method: static review of components + `eslint-config-next` a11y rules (clean) + testing-library role/label queries used throughout the tests. **No screen-reader session, no axe/Lighthouse run, no keyboard walkthrough in a real browser.**

| Check | Result |
|---|---|
| Form fields have visible labels | PASS (`Field` + labelled selects; search boxes use `sr-only` labels) |
| Errors announced | PASS (`role="alert"` on inline errors; `role="status"` on success/loading) |
| Tap targets >= 44 px | PASS by design (`min-h-11` on controls; 48 px attendance buttons); only login verified in a browser |
| Status never colour-only | PASS (pills carry text: Present/Absent/Late, Locked, Failed...) |
| Toggle state exposed | PASS (`aria-pressed` on attendance and correction buttons, `aria-expanded` on disclosure) |
| Tables | PASS (`<caption class=sr-only>`, header cells); mobile tables scroll inside their container |
| Focus visibility | NOT VERIFIED visually |
| Colour contrast | NOT VERIFIED (design tokens were contrast-checked in Stage 3 docs only) |
| Keyboard operation | NOT VERIFIED beyond native controls |

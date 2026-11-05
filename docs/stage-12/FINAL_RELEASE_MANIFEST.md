# Final release manifest (2026-11-05)

- Repository: https://github.com/Sathvik2005/campusos (public)
- Source commit: the commit that adds this line (see `git log`); documents rebuilt after the screenshot review
- Submission ZIP (outside the repo): `E:\HackAura\CampusOS_Submission.zip`, 3,904,717 bytes (3.7 MB, limit 25 MB)
- SHA-256: `d193d35a4a6a5c5de3626c2c30676f693adf33f740a27d5eebe3ac30a5d5f2be`

| File in ZIP | Bytes |
|---|---|
| `CampusOS_Technical_Design_Document.pdf` | 4,471,372 |
| `deployment.md` | 13,214 |

Verification: ZIP integrity test passed; extracted to a temporary folder; both files byte-identical to the committed versions; GitHub URL present; secret-pattern scan of `deployment.md` clean; no `.env`, keys, node_modules, virtualenv, build output or database dump included.

Test evidence at this commit: pytest 153 passed, Vitest 129 passed, Playwright 12 passed, plus a real-browser run of every screen and the offline flow in local demo mode, typecheck/lint/build clean, npm audit and pip-audit clean.
Not part of this release: any deployment, signed-in browser verification, PostgreSQL/Supabase verification, live AI output.

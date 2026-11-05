# Final release manifest (2026-11-05)

- Repository: https://github.com/Sathvik2005/campusos (public)
- Source commit the documents were built from: `dab33df` (this manifest is added in the next commit)
- Submission ZIP (outside the repo): `E:\HackAura\CampusOS_Submission.zip`, 205,850 bytes (0.2 MB, limit 25 MB)
- SHA-256: `837046110ef8e7007b03647b641b6c15d6d54b833745101d2cb506a8e341418e`

| File in ZIP | Bytes |
|---|---|
| `CampusOS_Technical_Design_Document.pdf` | 222,223 |
| `deployment.md` | 11,500 |

Verification: ZIP integrity test passed; extracted to a temporary folder; both files byte-identical to the committed versions; GitHub URL present; secret-pattern scan of `deployment.md` clean; no `.env`, keys, node_modules, virtualenv, build output or database dump included.

Test evidence at this commit: pytest 152 passed, Vitest 89 passed, Playwright 12 passed, typecheck/lint/build clean, npm audit and pip-audit clean.
Not part of this release: any deployment, signed-in browser verification, PostgreSQL/Supabase verification, live AI output.

# Text for the form field "Anything you want us to know"

I built the core slice end to end for one campus (B.Tech CSE): masters, mobile attendance, internal marks with a moderation lock, fee dues with simulated payments, an at-risk flag that only creates a mentor task after a human approves, and a read-only audit log. The hard part, offline attendance, writes to IndexedDB first, queues each session with a client UUID, and replays idempotently (a replay never creates a duplicate; a 409 is shown for review, never silently merged).

Verified by running it: 152 backend tests, 89 frontend tests, 12 browser tests, clean typecheck/lint/build, dependency audits, and an automated check that every API route rejects anonymous callers and enforces roles.

Not verified, and I want to be upfront: no signed-in browser run, no PostgreSQL/Supabase run, no live AI call, and nothing is deployed (no Supabase/Render credentials were available). deployment.md and docs/RUNBOOK.md, docs/PLAYBOOK.md let anyone set it up and check those parts. Only the B.Tech CSE sample row is seeded; the Mechanical and MBA rows belong to other programmes, which the brief says are optional depth. Repo: https://github.com/Sathvik2005/campusos

# Phase 4 — Development workflow

- **Branching:** work on `main` locally in small commits; use short-lived branches (`feat/…`, `fix/…`) once a remote exists. No force-push, no history rewriting.
- **Commits:** imperative subject, one logical change each, tests with the change. Never commit `.env*`, `.venv`, `node_modules`, build output.
- **Per milestone:** read the phase plan → implement one module → run backend `pytest`, frontend `npm test`, `typecheck`, `lint` → verify in the browser where UI changed → update `docs/STATUS.md` → commit.
- **Responsibilities:** FastAPI is the only writer to Postgres and enforces permissions; the frontend never talks to Postgres and treats role checks as presentation only.
- **Migrations:** Alembic only, linear, never edit an applied revision, never apply to a remote database without owner approval.
- **No fakes:** no dead buttons, no hardcoded demo data presented as real, no success messages before the API confirms.
- **Docs:** the `docs/phase-N/` folders are the source of truth; record deviations in `docs/STATUS.md` and `docs/prompts/PROMPT_NOTES.md`.

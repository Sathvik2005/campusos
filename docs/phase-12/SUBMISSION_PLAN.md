# CampusOS — Phase 12: Documentation and submission plan

**Objective:** evaluator pack. Follow the latest official assignment brief if it differs from anything here. Do not invent features, results, credentials or URLs.

## 1. Deliverables
1. **Technical Design Document** (PDF, DOCX source if practical).
2. **`deployment.md`**.
3. **`CampusOS_Final_Submission.zip`**: under 25 MB, containing only the two documents above (names per the brief). No `.env`, keys, dumps, `node_modules`, `.venv` or source copies. The public GitHub repository is linked from both documents; the live URL is included only if verified.

## 2. TDD structure
Cover page with GitHub URL → executive summary → business problem and context (client figures vs estimates labelled) → scope and MVP boundaries → functional requirements (implemented behaviour only) → architecture (with diagrams) → technology stack with rationale (only what is used) → database design with an ER diagram generated from the real schema → API architecture (implemented endpoints only) → authentication and RBAC → offline sync (with sequence diagram) → marks and moderation → fees (state that payments are simulated) → AI risk intelligence (rules vs explanation; never called a trained model) → security and privacy → responsive UI/UX with real screenshots at desktop and mobile → testing with real Phase 10 results (passed, failed, blocked, untested) → deployment → performance and accessibility → limitations and future work → references.
Quality: table of contents, page numbers, numbered figures and tables, readable diagrams, no placeholder text, no contradictions with the code.

## 3. `deployment.md`
Overview and URLs · verified prerequisites and versions · clone and install · frontend and backend local setup (PowerShell commands that were actually run) · database setup with **safe** migration instructions (never reset or drop a database holding data) · environment variable table (names only, public vs secret) · Vercel/Render/Supabase configuration · demo credentials · demo workflow · troubleshooting · known limitations · repository info.

## 4. Demo credentials policy
Dedicated synthetic Faculty and Office Admin accounts only. List a credential only if it was created and verified; otherwise give the setup procedure and label it "not yet provisioned". Never include personal accounts, service-role keys, database passwords or AI keys. Creating production accounts needs owner approval. Verify Faculty cannot reach admin operations and Admin can reach authorised modules.

## 5. Consistency audit
Compare PRD, architecture, real schema, real API, frontend, test results and deployment status; fix or remove anything outdated, including the superseded root docs and `docs/PHASES_SUMMARY.md` (it uses a different phase numbering).

## 6. Packaging verification
Build the ZIP in a clean directory, extract it elsewhere, open both documents, confirm size and contents, report the exact path only after it exists. Check git status, `.gitignore`, that no secret is tracked, that the README points to the real deployment, and record the final commit hash. Do not rewrite meaningful history.

## 7. Reports (`docs/phase-12/`)
`FINAL_DOCUMENTATION_AUDIT.md`, `SUBMISSION_CHECKLIST.md`, `FINAL_RELEASE_MANIFEST.md` listing repo URL, live URLs, document paths, ZIP path and size, demo-account status, commit hash, verified test status, limitations and remaining owner actions.

## 8. Completion
Both documents accurate and complete, demo access verified, URLs verified, no secrets, ZIP under 25 MB and verified, checklist complete.

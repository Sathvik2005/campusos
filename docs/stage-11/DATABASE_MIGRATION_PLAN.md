# Database migration plan

Single revision `0001` (initial schema, additive: creates tables only; contains no drop/truncate/alter of existing objects).

Procedure (owner approval required before step 5):
1. Confirm the target project and that it is the intended environment.
2. Run `SUPABASE_DATABASE_REVIEW.md` read-only inspection; stop on drift.
3. Backup: Supabase dashboard backup/point-in-time recovery (confirm it exists and note the timestamp) or `pg_dump` of the public schema.
4. Review the SQL offline: `alembic upgrade head --sql > 0001.sql`; confirm there is no `DROP`, `TRUNCATE` or `DELETE`.
5. **Owner approves**; apply with `alembic upgrade head` from a trusted machine (never as a Render pre-deploy or on app start).
6. Verify: `alembic current` = `0001`, table count 21, `/ready` reports `database: ok`.
7. Create synthetic demo accounts in Supabase Auth and matching `user_profiles` rows only with owner approval. Never run `app.seed` against production.

Prohibited: `supabase db reset`, dropping/truncating, rewriting `0001` after it is applied (create `0002` instead), disabling RLS.
Rollback: for a fresh database restore the pre-migration backup; `alembic downgrade -1` exists for `0001` but drops all tables, so it is only for an empty database.

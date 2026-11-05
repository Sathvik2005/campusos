# Supabase database review

**Status: NOT PERFORMED.** No Supabase project is connected, so the remote schema, Alembic version table, RLS policies and existing data were not inspected. Nothing here describes a remote database.

Local expectation (from `alembic/versions/0001_initial_schema.py`): 21 tables, 34 foreign keys, 17 unique and 16 check constraints, Alembic version `0001`. Local models and migration have no drift on SQLite.

Read-only inspection to run once credentials exist (no writes):
1. `select table_name from information_schema.tables where table_schema='public';`
2. `select * from alembic_version;`
3. Columns/constraints/indexes per table vs migration `0001`; `select * from pg_policies;`
4. Row counts of auth-linked tables (to avoid touching real data).
Outcome decides: empty database -> apply `0001`; existing CampusOS tables at `0001` -> nothing to do; anything else -> STOP and write a reconciliation plan for owner review.

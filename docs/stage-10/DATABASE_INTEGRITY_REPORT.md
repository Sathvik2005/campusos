# Database integrity report

Verified on SQLite only (Postgres/Supabase not reachable; `.env` absent).

- Schema: 21 tables, 34 foreign keys, 22 explicit indexes, 17 unique constraints, 16 check constraints (counted from SQLAlchemy metadata).
- Offline-critical constraints present: unique `idempotency_key` per attendance session; unique `(batch, subject, held_on, period)`; unique `(session, student)` per record; status check `present|absent|late`; period check 1..8.
- Migration: single linear revision `0001`; `alembic upgrade head` then `alembic check` reports **no drift** between models and migration; `alembic current` = `0001 (head)`.
- Remote safety: nothing was applied to any remote database; no destructive SQL was run.
- NOT done: Postgres DDL execution, comparison against an existing Supabase schema (none connected), downgrade rehearsal on Postgres, data-consistency queries on real data.

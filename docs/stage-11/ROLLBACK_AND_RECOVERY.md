# Rollback and recovery

| Failure | Action |
|---|---|
| Bad frontend deploy | Vercel dashboard: promote the previous deployment (instant); fix forward in Git |
| Bad backend deploy | Render: roll back to the previous deploy from the Deploys tab |
| Bad migration | Restore the pre-migration backup (point-in-time recovery or `pg_dump`); never edit an applied revision, add `0002` |
| Leaked secret | Rotate the key in Supabase/Render/AI provider immediately, redeploy, remove from Git history only if it was committed |
| Wrong CORS/redirect config | Fix `CORS_ORIGINS` / Supabase redirect URLs; no data impact |
Offline data safety: attendance saved offline stays in the browser's IndexedDB across backend outages and is replayed idempotently; it is lost only if the user clears site data before it syncs.
Backups: **not verified to exist**; confirm the Supabase plan's backup/PITR before the first production migration.

# Environment variable inventory (names only; values are never stored here)

| Variable | App | Required | Secret | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | frontend | yes | no | Base URL of the FastAPI service (HTTPS in production) |
| `NEXT_PUBLIC_SUPABASE_URL` | frontend | for login | no | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | frontend | for login | no (public by design) | Supabase anon key; used for sign-in only, never for data writes |
| `APP_ENV` | backend | yes | no | `production` disables `/docs` and `/openapi.json` |
| `LOG_LEVEL` | backend | no | no | Default `INFO` |
| `DATABASE_URL` | backend | yes | **yes** | Postgres connection string (Supabase pooled URL, SQLAlchemy format) |
| `SUPABASE_URL` | backend | yes | no | Project URL |
| `SUPABASE_JWKS_URL` | backend | yes | no | JWKS endpoint used to verify access tokens |
| `SUPABASE_JWT_AUDIENCE` | backend | no | no | Default `authenticated` |
| `CORS_ORIGINS` | backend | yes | no | Comma-separated explicit origins (wildcard rejected at startup) |
| `AI_PROVIDER_API_KEY` | backend | no | **yes** | Enables the optional AI explanation; empty means deterministic text only |

Never present in the frontend: Supabase service-role key, `DATABASE_URL`, AI key. `.env*` is gitignored except `.env.example`.

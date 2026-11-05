# Vercel deployment (frontend)

- Root directory: `frontend`; framework Next.js; install `npm install`; build `npm run build` (defaults).
- Environment variables (Production and Preview): `NEXT_PUBLIC_API_BASE_URL` = the Render HTTPS URL, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `NEXT_PUBLIC_*` values are inlined at build time: change them, then redeploy. Confirm the production build contains no `localhost` (`grep -r localhost .next` before promoting).
- Supabase Auth: add the production and preview URLs to Site URL / Redirect URLs.
- Security headers are set in `next.config.ts`.
- Do not run `vercel env pull` over an existing `.env.local`.
Current state: Vercel CLI is signed in but **no CampusOS project exists or was created**. Create it only after the Render URL is known:
`cd frontend && vercel link` (confirm scope) then `vercel --prod` after the env vars are set.

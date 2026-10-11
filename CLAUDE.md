# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

SaveMe Budget is a Thai-first expense tracker (UI text is Thai). It runs on Next.js 16.4 (App Router) with React 19, Tailwind v4, PostgreSQL via `pg`, and `zod`.

## Commands

```bash
npm run dev            # dev server (reads .env.local)
npm run db:migrate     # create DB if missing + apply db/schema.sql (idempotent, never drops)
npm run lint
npm run typecheck      # tsc --noEmit
npm test               # node:test over tests/*.test.mjs (needs DATABASE_URL; db.test hits the real DB)
npm run build          # output: "standalone"
node --env-file=.env.local --test tests/validation.test.mjs          # single test file
node --env-file=.env.local --test --test-name-pattern="credentials" tests/validation.test.mjs
node scripts/smoke.mjs http://127.0.0.1:3000   # E2E through the real forms against a running server
```

- `next start` does not work with standalone output. To run a production build locally:
  1. Copy the assets: `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/`
  2. Start it with `DATABASE_URL` set: `node .next/standalone/server.js`
- Local Postgres runs on `127.0.0.1:5433`. Its connection string is in `.env.local`, which Git ignores.
- Never drop or reset databases.

## Architecture

- **Cache Components is on** (`cacheComponents: true`, plus `partialPrefetching`).
  - Any component that reads cookies or queries the DB must render inside `<Suspense>`, otherwise the build fails.
  - `app/dashboard/page.tsx` is a static shell plus a `<Suspense>`-wrapped async `Dashboard`.
  - Mutations call `refresh()` from `next/cache`. There is no `use cache` anywhere.
- **Auth is hand-rolled, with sessions stored in the database.**
  - `lib/db.ts` hashes passwords with `crypto.scrypt`.
  - The session token is random. The cookie `sb_session` holds the raw token; the DB stores only its SHA-256 hash.
  - `lib/session.ts` (`server-only`) handles the cookie and exposes `getUser` / `requireUser`.
  - `proxy.ts` (Next 16's renamed middleware) only checks that the cookie exists. The real check is `requireUser()` in the page and in every Server Action.
- **Data access lives in `lib/db.ts`.** It holds all SQL.
  - Every expense function takes `userId` and filters by `user_id`. Callers must pass the id from `requireUser()`, never from form input. That is the per-user isolation guarantee.
  - `db.ts` deliberately has no `server-only` or Next imports, so `tests/*.test.mjs` can import it directly via Node's TS type stripping. Keep `lib/db.ts`, `lib/validation.ts` and `lib/format.ts` free of `@/` aliases and Next imports.
- **Server Actions live in `app/actions.ts`.**
  - Forms use `useActionState` and return `FormState`.
  - On error the action echoes `values` along with a fresh `stamp`; the client form uses `key={state.stamp}` to remount with those values.
  - Forms also work without JavaScript, and `scripts/smoke.mjs` relies on that by posting their hidden `$ACTION_*` inputs.
- **Money is a string end to end.**
  - Inputs are validated by regex, stored as `numeric(12,2)`, and selected as `::text`.
  - The monthly total comes from Postgres (`GROUP BY ROLLUP`), not from JS float math.
- **Dates:**
  - `spent_on` is a `date` selected as `::text` (YYYY-MM-DD).
  - "This month" and "today" use `Asia/Bangkok`, both in SQL (`monthSummary`) and in `lib/format.ts`.
  - Thai date display formats the calendar date in UTC so it doesn't shift a day.
- **Schema** is `db/schema.sql`, which may only use `IF NOT EXISTS` statements. `scripts/migrate.mjs` runs it on every container start.
- **Styling:**
  - Theme tokens (`navy-*`, `mint-*`, `canvas`, `ink`, `muted`, `line`) and the `animate-rise` / `animate-grow` animations are defined in `@theme` in `app/globals.css`.
  - The decorative credit-card stack is pure CSS (`.card-stack`).
  - A global `prefers-reduced-motion` rule disables all animation.

## Deployment

The repo deploys with Docker Compose: `db` (Postgres 18, no published port), `app` (standalone build), and `caddy` (automatic HTTPS for `savemebudget.melivecode.com`). Production secrets go in `.env` on the VPS (`DOMAIN`, `POSTGRES_USER`, `POSTGRES_PASSWORD`). `backup.sh` dumps the database with `pg_dump`. See `DEPLOY.md`.

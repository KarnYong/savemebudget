# SaveMe Budget

จัดการเงินง่ายขึ้น เหลือเงินเก็บมากขึ้น — a Thai-first expense tracker.

Next.js 16 (App Router, Cache Components) · PostgreSQL via `pg` · `zod` validation · database-backed sessions (scrypt passwords, httpOnly cookie, only the token hash is stored).

## Local development

Requires Node 24 and PostgreSQL running locally.

```bash
cp .env.example .env.local    # set DATABASE_URL
npm install
npm run db:migrate            # creates the database if missing, applies db/schema.sql (never drops)
npm run dev                   # http://localhost:3000
```

## Checks

```bash
npm run lint
npm run typecheck
npm test                      # unit tests + DB integration test (uses DATABASE_URL)
npm run build
node scripts/smoke.mjs http://127.0.0.1:3000   # end-to-end through the real forms against a running server
```

## Layout

- `app/` — pages (`/`, `/login`, `/signup`, `/dashboard`) and Server Actions (`app/actions.ts`)
- `lib/db.ts` — every query; expense queries are always scoped by the session's `user_id`
- `lib/session.ts` — session cookie handling (`requireUser`)
- `lib/validation.ts` — zod schemas and categories
- `db/schema.sql` — idempotent schema
- `proxy.ts` — optimistic redirect for `/dashboard` (the real check is server-side)

Deployment: see [DEPLOY.md](DEPLOY.md).

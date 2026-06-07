# Getting Started

How to run the project locally.

## Prerequisites

- **Node.js** — version that supports Next.js 16. (Project does not pin a specific version; use the latest LTS.)
- **npm** — comes with Node.
- **MySQL or MariaDB** — the app runs against a real database via Prisma 7
  (`@prisma/adapter-mariadb`, which works against either engine). You need a
  reachable instance and a `DATABASE_URL`.

## Environment

Copy `.env.example` to `.env` and fill in the values:

```
DATABASE_URL=mysql://user:password@host:3306/database
NEXTAUTH_SECRET=<32+ char random string>   # also signs the official-session cookie
NEXTAUTH_URL=http://localhost:3000
ROOT_ADMIN_EMAIL=...
ROOT_ADMIN_PASSWORD=...
```

Optional vars (see [../../CLAUDE.md](../../CLAUDE.md) for the full list): `REMEMBER_ME_TTL_DAYS`,
`DEFAULT_SESSION_TTL_HOURS`, `ACCOUNT_GRACE_PERIOD_DAYS`, `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` (enables the Google OAuth provider), `DB_CONNECTION_LIMIT`.

## Setup

```bash
npm install              # postinstall runs `prisma generate`
npm run db:push          # sync the Prisma schema to your database
npm run db:seed          # seed admins + realistic demo data (idempotent)
npm run dev
```

The dev server runs on `http://localhost:3000`.

> `db:seed` is **generator-driven**: it prints the joinable secret codes for the
> SCHEDULED/ONGOING rounds in its run summary. Read those codes off the seed output
> when you want to join a workspace — they are not hard-coded here.

## What to open

Event IDs come from the seed (`prisma/seed.ts`): `evt-draft`, `evt-sched`,
`evt-live`, `evt-live2`, `evt-fin-nat`, `evt-fin-asia`, `evt-open`.

| URL | What you'll see |
|-----|-----------------|
| `http://localhost:3000/` | Landing page |
| `http://localhost:3000/events/evt-live` | Live scoreboard for a sample ONGOING event |
| `http://localhost:3000/admin/login` | Admin login (seeded credentials, e.g. `owner@racewalk.local` / `owner1234`) |
| `http://localhost:3000/admin` | Admin dashboard (post-login) |
| `http://localhost:3000/judge/events/evt-live/join` | Judge join — enter a code from the seed output |
| `http://localhost:3000/head-judge/events/evt-live/join` | Head judge join |
| `http://localhost:3000/event-logger/events/evt-live/join` | Event logger join |

> There is **no `/timekeeper` route** and no `TIMEKEEPER` position. Lap/finish times
> are recorded by the **event logger** role (`OfficialPosition` is `JUDGE` /
> `HEAD_JUDGE` / `EVENT_LOGGER`).

See [../pages/README.md](../pages/README.md) for the full sitemap.

## Useful commands

```bash
npm run dev            # dev server
npm run build          # prisma generate + production build
npm run start          # serve the production build
npm run lint           # ESLint
npm test               # run the Vitest suite once
npm run test:coverage  # Vitest with coverage
npm run db:push        # sync Prisma schema to DB (no migrations)
npm run db:seed        # seed admins + demo data (idempotent)
npm run db:seed:reset  # wipe all tables and reseed
```

## Editing flow

- Edit a page or component file → the dev server hot-reloads.
- **Reads** are real Prisma queries inside Server Components. To change displayed
  data, edit the database (or `prisma/seed.ts` and re-seed) — there are no inline
  `MOCK_*` constants anymore.
- **Writes** go through Server Actions in `app/actions/*` (e.g. `cards.ts`,
  `timing.ts`, `events.ts`). They mutate via Prisma, then invalidate caches with
  `revalidatePath` / `revalidateTag` (see [lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)).
  User-facing feedback uses `sonner` toasts.

## Project structure

```
app/                  Next.js routes (App Router)
  actions/            Server Actions (writes) — cards, timing, events, rounds, …
  api/                Route handlers (leaderboard JSON, export, auth)
components/           Components, organized by domain
  ui/                 shadcn primitives
  partials/           Larger shared blocks (sidebar)
  <entity>/           Per-entity CRUD components
  judge/              Judge-side workspace + join forms (also head judge)
  timekeeper/         Lap-recorder component (shared by the event-logger workspace)
  events/             Public scoreboard (live-board)
hooks/                React hooks (use-mobile)
lib/                  Server utilities — prisma, auth, leaderboard, official-jwt, …
prisma/               schema.prisma + seed.ts
public/               Static assets
docs/                 This documentation
```

## Common gotchas

- **`params` is a Promise** — Next.js 16 requires `await props.params` (server) or
  `use(props.params)` (client). See [../conventions/code-style.md](../conventions/code-style.md).
- **Theme is fixed per route prefix** — no toggle. Admin/public is light; in-event
  roles are dark. See [../architecture/overview.md](../architecture/overview.md).
- **No global state library** — all interaction is `useState`. If you reach for
  Context, pause and ask whether props will do.
- **Codes are 6 chars** — generated with `crypto.getRandomValues` over the charset
  `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Join validates a code event-wide and is
  rate-limited (10/min/IP/event). See [decisions/0001-secret-code-charset.md](../decisions/0001-secret-code-charset.md).
- **Low DB connection limit** — `lib/prisma.ts` caps the pool at
  `DB_CONNECTION_LIMIT` (default 3) per instance; intentional for serverless fan-out.

## When you're stuck

- For displayed data, follow the Prisma query in the relevant Server Component
  (e.g. heavy reads live in [../../lib/leaderboard.ts](../../lib/leaderboard.ts)).
- For a write path, open the matching action in `app/actions/`.
- Read the relevant feature doc under [../features/](../features/) before editing.

## Deployment

The app targets Vercel (serverless) with a MySQL/MariaDB instance adjacent. The
public scoreboard is built to absorb spectator load at the CDN edge (see
[../architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md));
several Active-CPU optimizations (5-minute auth trust window, trimmed middleware
matcher, throttled official-cookie re-sign) are documented there.

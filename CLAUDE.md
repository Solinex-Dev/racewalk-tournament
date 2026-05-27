# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Prisma generate + production build
npm run lint         # ESLint check
npm run db:push      # Sync Prisma schema to DB (no migrations)
npm run db:seed      # Seed admin users (idempotent)
npm run db:seed:reset  # Wipe auth tables and reseed
```

No test runner is configured. There is no `npm test` command.

**Database workflow**: prefer `db:push` for local schema sync rather than `prisma migrate dev/deploy`. Do not autonomously run `prisma migrate`; suggest and let the user run. Never hand-write `migration.sql` files.

## Environment Variables

Required in `.env` (see `.env.example`):
- `DATABASE_URL` — `mysql://user:password@host:3306/database`
- `NEXTAUTH_SECRET` — random secret for JWT signing
- `NEXTAUTH_URL` — base URL (e.g. `http://localhost:3000`)

Optional:
- `REMEMBER_ME_TTL_DAYS` (default 30) — session duration when "remember me" is checked
- `DEFAULT_SESSION_TTL_HOURS` (default 24) — session duration without "remember me"
- `ACCOUNT_GRACE_PERIOD_DAYS` (default 30) — days between SUSPENDED → auto-DELETED
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — enables Google OAuth provider

## Architecture

### Tech Stack
- **Next.js 16** with App Router (`app/` directory)
- **TypeScript** (strict mode), path alias `@/*` → project root
- **Tailwind CSS v4** with `tw-animate-css`
- **shadcn/ui** (Radix UI primitives) in `components/ui/`
- **Framer Motion** for animation
- **input-otp** for the 6-character secret code entry
- **Prisma 7** (with `@prisma/adapter-mariadb`, works against MySQL or MariaDB) — `prisma/schema.prisma`, singleton at `lib/prisma.ts`
- **NextAuth 4** (JWT strategy + `UserSession` row tracking) — config in `auth.ts`, route handler at `app/api/auth/[...nextauth]/route.ts`
- **Route protection**: `proxy.ts` at project root (Next.js middleware) gates `/admin/*` (requires `role === "ADMIN"`)

### Route Structure & Role Separation

The app has five non-admin user roles plus an admin panel, each with its own route tree:

| Role | Route prefix | Theme |
|------|-------------|-------|
| Admin | `/admin/(pages)/` | Light (slate-50 bg, sidebar layout) |
| Judge | `/judge/events/[eventId]/` | Dark (slate-950 bg) |
| Head Judge | `/head-judge/events/[eventId]/` | Dark |
| Event Logger | `/event-logger/events/[eventId]/` | Dark |
| Timekeeper | `/timekeeper/events/[eventId]/` | Dark |
| Public scoreboard | `/events/[eventId]` | Dark |

Each non-admin role has two pages: a **join page** (`/join`) and a **workspace page**. The join page takes a 6-character alphanumeric secret code (`round_secret_code`) that the Admin generates per judge per round.

Admin panel routes are inside a route group `(pages)` with a shared `layout.tsx` that renders `DashboardSidebar` (`components/partials/admin-sidebar/`). Admin auth is at `(auth)/login`.

The UI language is **Thai** (`lang="th"` in root layout). Most labels, alerts, and user-facing strings are in Thai.

### Auth & Session Architecture

`auth.ts` configures NextAuth with a JWT session strategy. Beyond standard NextAuth behaviour, this app adds:

- **`UserSession` table** — a row is created on every login (with `ipAddress`, `userAgent`, `rememberMe`, `expiresAt`). Session revocation sets `revokedAt`; the JWT callback rejects tokens whose `sessionId` has been revoked.
- **User status lifecycle** — `lib/user-status.ts` exposes `resolveUserStatus()` (ACTIVE → SUSPENDED → auto-DELETED after grace period) and `finalizeDeletion()` (atomically anonymises email, revokes sessions, logs activity). Login is blocked for non-ACTIVE users.
- **Activity logging** — `lib/activity-log.ts` defines `ActivityLogAction` constants and `createActivityLog()`, which writes to the `ActivityLog` table and swallows errors so it never breaks a request.
- **API routes** — `app/api/auth/logout/route.ts` (POST, logs `USER_LOGGED_OUT` before client `signOut`) and `app/api/auth/register/route.ts` (POST, admin-only new admin creation).

`types/next-auth.d.ts` augments `Session.user` with `id` and `role`, and adds `sessionId` to `Session` and JWT.

### lib/ Module Map

| File | Purpose |
|------|---------|
| `lib/prisma.ts` | Prisma singleton; parses `DATABASE_URL` for MariaDB adapter |
| `lib/validation.ts` | `normalizeEmail()`, `isValidEmailFormat()`, `validatePasswordLength()` + length constants |
| `lib/user-status.ts` | `resolveUserStatus()`, `finalizeDeletion()`, `getGracePeriodDays()` |
| `lib/activity-log.ts` | `createActivityLog()`, `ActivityLogAction` const enum |
| `lib/deleted-email-placeholder.ts` | `buildDeletedUserEmail()` / `parseOriginalEmailFromDeletedPlaceholder()` for anonymised accounts |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge) |

### Data Flow (Current State)

**Auth is wired to Prisma; domain data is still mocked.** The Prisma schema has `User`, `UserSession`, `Account`, `VerificationToken`, `ActivityLog` only.

Domain models (Event, Round, Athlete, Card, etc.) are **not yet in the Prisma schema** — they're still inline `MOCK_*` constants. See `docs/architecture/data-model.md` for the planned shape.

Mock locations:
- `app/admin/(pages)/events/page.tsx` — `MOCK_EVENTS`
- `app/admin/(pages)/admins/page.tsx` — `MOCK_ADMINS`
- `app/admin/(pages)/events/[eventId]/moderator/page.tsx` — `MOCK_EVENT_STATUS`, `MOCK_ATHLETES_BY_ROUND`, `MOCK_JUDGES_BY_ROUND`, `MOCK_ACTIVITY_LOGS`, `MOCK_PENDING_RED_CARDS`
- `app/events/[eventId]/page.tsx` — `MOCK_PUBLIC_EVENT`
- `app/judge/events/[eventId]/page.tsx` — `MOCK_JUDGE_EVENT_INFO`
- `components/judge/judge-workspace.tsx` — `INITIAL_ATHLETES`
- `components/rounds/round-form.tsx` — `MOCK_ATHLETE_OPTIONS`, `MOCK_JUDGE_OPTIONS`
- `components/judge/judge-join-form.tsx` — `MOCK_CODE_DESTINATIONS`

Every domain form submission still calls `console.log` + `alert` with "mock" language. All `TODO` comments mark where real API/database calls go.

### Card System (Domain Logic)

The core scoring component is `components/judge/card-matrix.tsx`:
- `MAX_YELLOW = 2` — each judge can issue max 2 yellow cards per athlete (yellow cards are notes, no symbol)
- `MAX_RED = 4` — max 4 red cards total per athlete across all judges (DQ at 4)
- Each judge can give max **1 red card per athlete**
- Red cards have symbols: `~` (ยกเท้า/lifted foot) or `>` (เข่างอ/bent knee)
- `isFromThisJudge` flag on red card details highlights that judge's own card with a yellow ring
- Max yellow/red cards in moderator view scale with judge count: `maxYellow = judges × 2`, `maxRed = judges × 1`

### Secret Code Generation

`components/rounds/round-form.tsx` contains `generateRoundSecretCode()` — 6 chars from charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no ambiguous chars I/O/0/1). Each judge in a round gets a unique `round_secret_code`. Head Judge and Event Logger also get separate codes.

### Component Conventions
- Client components use `"use client"` at the top; most page components are Server Components
- `params` in Next.js 16 is a `Promise<{...}>` — unwrap with `await props.params` (server) or `use(props.params)` (client)
- Forms are fully controlled with local `useState`, no form library
- No global state management; no React Context in use
- `components/providers/session-provider.tsx` is the client wrapper around NextAuth's `SessionProvider`, mounted in `app/layout.tsx`
- `prisma/load-env.ts` must be the first import in any seed/script file to load `.env` and `.env.local` before Prisma initialises

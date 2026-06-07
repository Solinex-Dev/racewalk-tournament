# Architecture Overview

High-level shape of the system. For the underlying tech versions, see [tech-stack.md](tech-stack.md).

## System context

```
            ┌──────────────────────────────────────────┐
            │              Browsers                    │
            │  Admin · Head Judge · Judge · Event      │
            │  Logger · Public Viewer                  │
            └─────────────┬────────────────────────────┘
                          │ HTTPS
                          ▼
            ┌──────────────────────────────────────────┐
            │         Next.js App (App Router)          │
            │  • Role-prefixed route trees              │
            │  • Server Components read via Prisma      │
            │  • Server Actions for all writes          │
            │  • Cached JSON route for the scoreboard   │
            └─────────────┬────────────────────────────┘
                          │ Prisma 7 (mariadb adapter)
                          ▼
            ┌──────────────────────────────────────────┐
            │           MySQL / MariaDB                 │
            │  Events · Rounds · Athletes · Judges ·   │
            │  Cards · Lap/Finish times · Activity log  │
            └──────────────────────────────────────────┘
```

Status: **Implemented.** Reads are Prisma queries inside Server Components; writes are Server Actions in `app/actions/*`; the public scoreboard polls a CDN-cached JSON route. The Prisma schema lives at [prisma/schema.prisma](../../prisma/schema.prisma) — see [data-model.md](data-model.md).

## Routing model: role prefix + event resource

```
/<role>/events/[eventId]/<page>
```

- The **role prefix** (`/admin`, `/judge`, `/head-judge`, `/event-logger`) selects the role's view.
- The **event id** selects the resource.
- Public routes use `/events/[eventId]` (no role prefix).

> Note: lap timekeeping is done by the **Event Logger** role. There is no separate `/timekeeper` route; the lap-recording UI component happens to live in `components/timekeeper/lap-recorder.tsx` but is mounted only by the event-logger workspace, and `OfficialPosition` has no `TIMEKEEPER` value.

### Why role-prefix routing

| Alternative | Problem |
|-------------|---------|
| Single `/event/[id]?role=X` | URL hides which view you're on; harder to bookmark/share role-specific screens |
| Single `/event/[id]` with internal role-switch | One layout has to satisfy all roles; conflicting chrome and theme |
| Role on subdomain | Operational overhead, certs, no benefit |

Role-prefix routing keeps each tree's layout and auth surface independent. It also makes the URL self-describing.

## Auth model

Three auth surfaces:

1. **Admin** — email + password → NextAuth JWT session, backed by a `UserSession` row that can be revoked. Config in [auth.ts](../../auth.ts); the `/admin/*` tree is gated by [proxy.ts](../../proxy.ts) (requires `role === "ADMIN"`). Login lives in the `(auth)` route group (`/admin/login`).
2. **In-event officials** — a 6-character secret code per official per round. Validating a code (`joinAsOfficial` in [app/actions/officials.ts](../../app/actions/officials.ts), rate-limited) issues a signed `rw_official_session` JWT cookie (jose, HS256 over `NEXTAUTH_SECRET`) carrying `{ officialId, judgeId, roundId, eventId, position, zone }`. No account, no persistent identity. See [features/secret-code-access](../features/secret-code-access.md).
3. **Public** — no auth. URL is the access; the scoreboard JSON is identical for everyone (which is what makes it CDN-cacheable).

## Layout strategy

- `app/layout.tsx` — root layout: `lang="th"`, Geist fonts, metadata, the `sonner` `<Toaster>`, Vercel `<Analytics />`, and the NextAuth `SessionProvider`.
- `app/admin/(pages)/layout.tsx` — admin shared layout with `DashboardSidebar`. Light theme.
- `app/admin/(auth)/login/layout.tsx` — auth layout without the sidebar.
- In-event role pages each have their own dark-themed layout.
- Public pages share the dark theme.

## Client vs. server components

- Most page-level components are **Server Components** by default and query Prisma directly at render time.
- Components that need interaction (forms, workspace state, timers, the live board) are marked `"use client"`.
- The convention used in this project: pages stay server, and they wrap a `<ClientComponent />` for the interactive part. Examples:
  - `JudgeJoinForm` (client) inside server page
  - `JudgeWorkspace` (client) inside server page
  - `LiveBoard` (client) inside the public server page
  - `EventForm`, `AthleteForm`, `RoundForm`, etc. — all client, used by server pages

## State management

- **No global store** — no Redux, Zustand, or Context for app state.
- All interactive state is `useState` at the component level. The only Context wrapper is `components/providers/session-provider.tsx` (NextAuth's `SessionProvider`).
- Cross-user freshness is handled by the read/revalidate cycle (Server Actions invalidate cached views; clients re-fetch on an interval), not by a shared client store. See [state-and-data-flow.md](state-and-data-flow.md).

## Data flow

| Concern | Mechanism |
|---------|-----------|
| Read data | Prisma queries in Server Components (the public board's heavy nested read is in [lib/leaderboard.ts](../../lib/leaderboard.ts)) |
| Write data | Server Actions in `app/actions/*`, then `revalidatePath` / `revalidateTag` via [lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts) |
| Sync to officials | `AutoRefresh` (`router.refresh()`) every 2000ms when the round is SCHEDULED, else 2500ms |
| Sync to spectators | `LiveBoard` polls the CDN-cached [/api/events/[eventId]/leaderboard](../../app/api/events/[eventId]/leaderboard/route.ts) every 5s |
| Persistence | MySQL / MariaDB via Prisma 7 (`@prisma/adapter-mariadb`) |

## Related docs

- [tech-stack.md](tech-stack.md) — versions and libraries
- [data-model.md](data-model.md) — entity relationships and the Prisma schema
- [state-and-data-flow.md](state-and-data-flow.md) — read/write/real-time mechanics
- [../pages/README.md](../pages/README.md) — full route tree

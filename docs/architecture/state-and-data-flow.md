# State & Data Flow

How data moves through the system: Prisma reads in Server Components, Server Actions for writes, and an interval-based read/revalidate loop for live updates.

Status: **Implemented.** The domain runs on a real Prisma backend ([prisma/schema.prisma](../../prisma/schema.prisma)). There are no `MOCK_*` constants and no `console.log` + `alert` writes left in the live paths.

## Read path

```
Server Component
  └─ await prisma.<model>.findMany/findUnique(...)
  └─ pass serialized props to a Client Component
```

Listing and detail pages are server components — they read from Prisma at render time, no client-side fetching for the initial paint. The public scoreboard's heavy nested read is factored into [lib/leaderboard.ts](../../lib/leaderboard.ts) (`queryLeaderboardRaw` / `buildLeaderboard`) so the same query feeds both the initial server render and the polled JSON route.

## Write path

All writes are **Server Actions** under [app/actions/](../../app/actions/). Each action:

1. Authorizes — admin actions call `requirePermission(resource, action)` ([lib/authz.ts](../../lib/authz.ts)); in-event actions call `requireOfficialSession([...positions])` ([lib/official-session.ts](../../lib/official-session.ts)).
2. Mutates via Prisma (often inside a `$transaction` for multi-row invariants).
3. Revalidates affected views.

| Domain | Action file |
|--------|-------------|
| Events, registrations, BIBs | [app/actions/events.ts](../../app/actions/events.ts) |
| Rounds, start lists, officials + secret codes | [app/actions/rounds.ts](../../app/actions/rounds.ts) |
| Round start / stop timing | [app/actions/round-timing.ts](../../app/actions/round-timing.ts) |
| Lap / finish times | [app/actions/timing.ts](../../app/actions/timing.ts) |
| Cards (judge / head judge) | [app/actions/cards.ts](../../app/actions/cards.ts) |
| Moderator live corrections | [app/actions/moderator.ts](../../app/actions/moderator.ts) |
| Athletes / Judges / Affiliations / Orgs / Admins | [app/actions/athletes.ts](../../app/actions/athletes.ts), [judges.ts](../../app/actions/judges.ts), [affiliations.ts](../../app/actions/affiliations.ts), [organizations.ts](../../app/actions/organizations.ts), [admins.ts](../../app/actions/admins.ts) |
| Official join / logout | [app/actions/officials.ts](../../app/actions/officials.ts) |

### Cache invalidation

Race-day writes (card / lap / finish / round) call `revalidateRaceDayViews(eventId)` in [lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts), which:

- `revalidatePath` for `/judge/events/{id}`, `/head-judge/events/{id}`, `/event-logger/events/{id}`, `/admin/events/{id}/moderator`, and `/events/{id}`;
- `revalidateTag(leaderboardTag(eventId), "max")` — purges the cached public leaderboard query so the next poll re-reads the DB.

## Real-time sync

There is no WebSocket / SSE layer; freshness comes from short read intervals plus write-time revalidation.

### Officials (judge / head judge / event logger)

The workspace pages mount [components/common/auto-refresh.tsx](../../components/common/auto-refresh.tsx) (`AutoRefresh`), a client component that calls `router.refresh()` on a timer. All three pass:

```tsx
<AutoRefresh intervalMs={round.status === "SCHEDULED" ? 2000 : 2500} />
```

So the server component re-renders (re-reads Prisma) every **2000ms while SCHEDULED**, **2500ms otherwise**. The public home page uses `15000ms`.

### Public scoreboard

[components/events/live-board.tsx](../../components/events/live-board.tsx) (`LiveBoard`, client) no longer re-renders the page. It holds the DTO in `useState(initial)` and **polls the JSON route every 5s** (`POLL_INTERVAL_MS`) via `fetch('/api/events/{eventId}/leaderboard[?round=…]')` with an `AbortController`. On a non-OK response or network blip it keeps the last good state (never blanks the board). Switching `?round=` adopts the freshly server-rendered `initial` immediately. The race clock is [components/common/live-timer.tsx](../../components/common/live-timer.tsx) (`LiveTimer`, `useSyncExternalStore`, frozen once `endedAt` is set).

### Two-layer cache behind the board

1. **CDN layer** — the JSON route ([app/api/events/[eventId]/leaderboard/route.ts](../../app/api/events/[eventId]/leaderboard/route.ts)) sets `Cache-Control: public, s-maxage=4, stale-while-revalidate=10`, so repeat polls within 4s are served from Vercel's edge **without invoking the function** (spectators absorbed at the CDN → ~0 Active CPU). No cookies/session are read in this route, which is what keeps it cacheable.
2. **Next data cache** — `getCachedLeaderboard` ([lib/leaderboard.ts](../../lib/leaderboard.ts)) wraps the query in `unstable_cache` tagged `event:{eventId}` with `LEADERBOARD_REVALIDATE_SECONDS = 5`; purged on every race-day write via `revalidateTag`.

This replaced an earlier design where the board re-rendered the whole server component on a 500ms `router.refresh()` — one full RSC render per spectator per tick.

## Auth & session flow

- **Admin:** NextAuth JWT strategy ([auth.ts](../../auth.ts)). On login a `UserSession` row is created (`ipAddress`, `userAgent`, `rememberMe`, `expiresAt`); the JWT callback caches its DB check for 5 minutes (`SESSION_REVALIDATE_EVERY_SEC`) to avoid two DB queries per request, then re-validates session revocation and user status. Mutating admin actions always re-check live via `getCurrentAdmin()`.
- **In-event official:** the `rw_official_session` cookie (12h TTL, [lib/official-jwt.ts](../../lib/official-jwt.ts)) is issued after a 6-char code join and slid forward by middleware on activity (re-signed only in the last ~25% of its TTL to save CPU). `requireOfficialSession()` enforces the allowed position per action.

## Where state lives — current rules

- **Server pages** hold no client state; they read Prisma and pass props down.
- **Client components** hold `useState` for the interactive bits (form fields, the live DTO, timers).
- **No Context** for app state, **no global store** — the only provider is NextAuth's `SessionProvider`.
- **Activity logs** are two distinct stores: the system audit trail `ActivityLog` (FK to User, written via [lib/activity-log.ts](../../lib/activity-log.ts)) and the per-round race timeline `RoundActivityLog` (FK to Round, denormalized actor strings). The race timeline is the single source the head-judge / event-logger / moderator views read.

## Possible future work

- A managed real-time channel (SSE / Pusher / Ably) could replace interval polling if sub-second latency is ever required; today the interval + CDN approach is deliberate for the Vercel Active-CPU budget.

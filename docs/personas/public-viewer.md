# Public Viewer

**Auth**: None
**Routes**: `/`, `/events/[eventId]`
**Theme**: Dark

## What a public viewer does

Watches the live scoreboard. Can be a spectator at the venue, a relative following from home, or a federation official cross-referencing results.

No accounts, no codes. The URL is the access. These public routes deliberately bypass the middleware ([proxy.ts](../../proxy.ts)) so spectator traffic pays no auth/token cost.

## Features used

| Feature | Notes |
|---------|-------|
| [live-scoreboard](../features/live-scoreboard.md) | Primary |

## Pages visited

- [Landing](../pages/public/landing.md)
- [Event live](../pages/public/event-live.md)

## How it works

The event page server-renders the initial board, then the client component [components/events/live-board.tsx](../../components/events/live-board.tsx) polls `/api/events/[eventId]/leaderboard` every 5 seconds ([app/api/events/[eventId]/leaderboard/route.ts](../../app/api/events/[eventId]/leaderboard/route.ts)) and swaps in the new DTO. The route returns the same JSON for everyone (no cookies/session), built by [lib/leaderboard.ts](../../lib/leaderboard.ts) and served with `Cache-Control: public, s-maxage=4, stale-while-revalidate=10`, so repeat polls are absorbed at Vercel's CDN edge without invoking the function. Every card/lap/finish/round write purges that cache via `revalidateTag` ([lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)). On a failed poll the board keeps its last good state rather than blanking; the live race clock is [components/common/live-timer.tsx](../../components/common/live-timer.tsx).

## Typical journey

1. Open the URL (received via social media, federation site, QR code at venue).
2. Land on `/` or directly on `/events/[eventId]`.
3. Watch positions, lap counts, and card totals update every few seconds.
4. Switch the `?round=` selector to view a specific round; finished rounds keep serving as a result view.

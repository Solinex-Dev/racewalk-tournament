# Public · Event Live Scoreboard

**Route**: `/events/[eventId]` (optional `?round=<roundId>`)
**Role**: [public-viewer](../../personas/public-viewer.md) (no auth)
**Type**: Server Component shell + Client board
**Code**: [app/events/[eventId]/page.tsx](../../../app/events/[eventId]/page.tsx), [components/events/live-board.tsx](../../../components/events/live-board.tsx), [components/events/leaderboard-rows.tsx](../../../components/events/leaderboard-rows.tsx), [lib/leaderboard.ts](../../../lib/leaderboard.ts), [app/api/events/[eventId]/leaderboard/route.ts](../../../app/api/events/[eventId]/leaderboard/route.ts)

**Status**: Implemented

## Purpose

The public-facing real-time view of an event. Shows all athletes, their card totals, lap progress, and times for the current (or selected) round.

## UI Sections

1. **Event header** — name, distance (metres), location, current round name; a pulsing `LIVE` badge while the race is live
2. **Elapsed timer** — [`LiveTimer`](../../../components/common/live-timer.tsx) ticks the current round's running time (frozen once `endedAt` is set)
3. **Lap counter** — `currentLap` / `lapCount`, plus a "เหลือในสนาม" (remaining on field) count
4. **Athlete table** — [`LeaderboardRows`](../../../components/events/leaderboard-rows.tsx), rows in fixed start-list order, each showing:
   - Rank (shown only once the round is `FINISHED`), lap, bib, name + affiliation
   - Red-card matrix (confirmed reds, with `~`/`>` symbol glyphs)
   - Status (`OK` / `DQ` / `DNF`)
   - On desktop (≥992px) the table paginates 20 athletes per page and auto-advances every 10s

Round selection is by the `?round=` query parameter (so simultaneously-running rounds are each viewable). There is no in-board round-tab selector — viewers land on a specific round via the per-round cards on the [landing page](../public/landing.md). If `?round=` is omitted, [`buildLeaderboard`](../../../lib/leaderboard.ts) picks the round: first `ONGOING`, else last `FINISHED`, else the first round (by `scheduledTime`).

## Data Displayed

Real data. The server shell calls `getCachedLeaderboard(eventId)` and `buildLeaderboard(event, roundParam)` ([lib/leaderboard.ts](../../../lib/leaderboard.ts)) to produce a serializable `LeaderboardDTO` (event, `currentRound`, `rows`, `lapCount`, `isRaceLive`, `remainingOnField`, …). BIB is event-scoped (`EventAthlete.bib`); yellow counts include all non-deleted YELLOW cards, red counts/details include only `RED` cards in `state: CONFIRMED`. `404`s via `notFound()` when the event is missing.

If a judge/head-judge/event-logger still has an official session for this event, the shell reads that cookie ([lib/official-session.ts](../../../lib/official-session.ts)) and renders a "back to workspace" link — this per-viewer value is computed once on load and is deliberately kept out of the cached JSON.

## Actions

Read-only. The only interaction is switching rounds via the URL (`?round=`).

## Features Surfaced

- [live-scoreboard](../../features/live-scoreboard.md) (primary)
- [card-scoring](../../features/card-scoring.md) (card display, read-only)
- [event-logging](../../features/event-logging.md) (times, read-only)
- [timekeeping](../../features/timekeeping.md) (laps, read-only)

## State / Behavior

- **Real-time via client polling.** [`LiveBoard`](../../../components/events/live-board.tsx) holds the DTO in `useState(initial)` and polls `GET /api/events/[eventId]/leaderboard[?round=…]` every **5s** with an `AbortController`. On a non-OK response or network blip it keeps the last good state, so the board never blanks.
- **Two-layer cache.** The route handler ([app/api/events/[eventId]/leaderboard/route.ts](../../../app/api/events/[eventId]/leaderboard/route.ts)) sets `Cache-Control: public, s-maxage=4, stale-while-revalidate=10`, so repeat polls within 4s are served from Vercel's CDN without invoking the function. Behind that, `getCachedLeaderboard` wraps the heavy query in `unstable_cache` tagged `event:${eventId}`. Every card/lap/finish/round write purges that tag via [`revalidateRaceDayViews`](../../../lib/revalidate-race-day.ts), so the board refreshes within seconds of a scoring change.
- **Switching rounds** adopts the server-rendered `initial` for the new round immediately (React's "adjust state during render" pattern) rather than waiting for the next poll.

## Open Issues / TODOs

- Result emphasis after `FINISHED` status on the board itself (podium/medals already appear on the landing-page round card)
- Share buttons / OG image

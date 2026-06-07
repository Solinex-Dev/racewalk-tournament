# Live Scoreboard

**Status**: Implemented
**Roles**: [public-viewer](../personas/public-viewer.md); also viewable by every other role
**Routes**: `/events/[eventId]`, `/`
**Entities**: `Event`, `Round`, `RoundAthlete`, `EventAthlete` (BIB), `Card`, `LapTime`, `FinishTime` — projected to a serializable `LeaderboardDTO`
**Related features**: [card-scoring](card-scoring.md) (cards displayed), [event-logging](event-logging.md) (times displayed), [timekeeping](timekeeping.md) (laps displayed)

## Overview

The public-facing live view of an event. No authentication. Anyone with the URL can watch, and the board updates in near-real-time as judges and the event logger write data.

Shows for each round:

- Athletes with bib, name, affiliation, country
- Yellow and red card totals (only `CONFIRMED` red cards count on the public board)
- Rank (computed on finish, shown once the round is finished)
- Split / total time
- Status (`OK`, `DQ`, `DNF`)
- Current lap and how many athletes remain on the field

## Data shape

The board renders a serializable `LeaderboardDTO` built by `buildLeaderboard()` in [lib/leaderboard.ts](../../lib/leaderboard.ts). It carries the event, the selected round, and one `LeaderboardRow` per athlete (all `Date`s rendered as ISO strings so the DTO is JSON-cacheable):

```typescript
LeaderboardDTO {
  event:    { id, name, location, distanceKm, status, ... }
  currentRound:  { id, name, distanceKm, lapCount, currentLap, status, startedAt, endedAt } | null
  rows:     LeaderboardRow[]   // bib, name, affiliation, country, yellowCards, redCards,
                               // redCardDetails, currentLap, totalTime, status, rank
  lapCount, remainingOnField, isRaceLive, isCurrentRoundFinished, elapsedFallback
}
```

**Round selection precedence** (`buildLeaderboard`): explicit `?round=` → first `ONGOING` → last `FINISHED` → first round.

**Display order vs. rank**: rows are shown in the round's fixed start-list order (`RoundAthlete.sortOrder` asc, `athleteId` tiebreak) and are **never** reordered by finish. `rank` is computed separately on a finish-sorted copy (only `status === "OK" && isFinished` athletes get a sequential rank; everyone else `null`) and stamped back by `athleteId`. See [lib/athlete-sort.ts](../../lib/athlete-sort.ts).

BIB lives at the **event** level (`EventAthlete.bib`) and is mapped per athlete. Distances are stored in km but presented in metres ([lib/distance.ts](../../lib/distance.ts)).

## What's shown

| Element | Source |
|---------|--------|
| Event header | event name, location, distance, status |
| Live race clock | [`LiveTimer`](../../components/common/live-timer.tsx) — ticks from `round.startedAt`, frozen at `endedAt` |
| Lap counter | `currentRound.currentLap` / `lapCount` |
| Remaining on field | `remainingOnField` / total rows |
| Athlete table | [`LeaderboardRows`](../../components/events/leaderboard-rows.tsx) — fixed start-list order, rank shown when finished |
| Card display | reuses the [card matrix](../../components/judge/card-matrix.tsx) |

## How it stays live (read + cache + poll)

The board is read-only — every value is computed from the writes of other features (cards from [card-scoring](card-scoring.md); lap/finish times from [event-logging](event-logging.md); rank derived from finish + DQ status). The live mechanism has three layers:

1. **Server shell** — [app/events/[eventId]/page.tsx](../../app/events/[eventId]/page.tsx) is a Server Component. It renders once per page load (it reads the viewer's official cookie to offer a "back to workspace" button, which makes it dynamic) and hands an `initial` DTO to the client `<LiveBoard>`. It does **not** re-render on a timer.
2. **Client poll** — [`LiveBoard`](../../components/events/live-board.tsx) (`"use client"`) holds the DTO in `useState` and polls `GET /api/events/{eventId}/leaderboard[?round=…]` every `POLL_INTERVAL_MS = 5000` (5s) with an `AbortController`. On a non-OK response or network blip it keeps the last good state (the board never blanks). Switching `?round=` adopts the freshly server-rendered `initial` immediately.
3. **CDN-cached JSON route** — [app/api/events/[eventId]/leaderboard/route.ts](../../app/api/events/[eventId]/leaderboard/route.ts) (`runtime = "nodejs"`) returns the DTO with `Cache-Control: public, s-maxage=4, stale-while-revalidate=10`. Repeat polls within 4s are absorbed at Vercel's edge without invoking the function, so a spectator crowd costs ~0 Active CPU. No cookies/session are read here — the leaderboard is identical for everyone, which is what makes it cacheable.

Underneath, the heavy nested query (`queryLeaderboardRaw`) is wrapped in `unstable_cache` (`getCachedLeaderboard`, tag `event:{eventId}`, `LEADERBOARD_REVALIDATE_SECONDS = 5`). Every card/lap/finish/round write calls `revalidateRaceDayViews(eventId)` ([lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)), which `revalidateTag`s that key — so a confirmed card or a recorded lap purges the cache and shows up on the next poll. The home page `/` uses [`AutoRefresh`](../../components/common/auto-refresh.tsx) at 15s.

## Pages

- [Public event live](../pages/public/event-live.md) — the scoreboard itself
- [Landing](../pages/public/landing.md) — entry point with link to current event

## TODOs before production

- SEO / OG tags so shared links preview nicely
- Spectator-friendly result view after `FINISHED` (medals, podium emphasis)

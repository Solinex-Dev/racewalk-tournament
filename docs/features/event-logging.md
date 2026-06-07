# Event Logging

**Status**: Implemented
**Roles**: [event-logger](../personas/event-logger.md)
**Routes**: `/event-logger/events/[eventId]`
**Entities**: `LapTime`, `FinishTime`, `RoundAthlete`, `Round` (`currentLap`), `RoundActivityLog`
**Related features**: [timekeeping](timekeeping.md) (same workspace, same recorder), [live-scoreboard](live-scoreboard.md), [card-scoring](card-scoring.md) (also written to the round timeline)

## Overview

The Event Logger records **lap times** and **finish times** for a round. In the current code this is the single tap-driven recorder ([`LapRecorder`](../../components/timekeeper/lap-recorder.tsx)) — the same component and Server Actions described in [timekeeping](timekeeping.md). The earlier "manual MM:SS text entry" mode has been replaced by the tap-to-capture flow, which reads the elapsed time off the shared race clock at the moment of the tap.

Every lap, finish, card, and round transition is also written to the per-round `RoundActivityLog` table, which forms the canonical race timeline. That timeline is surfaced (read-only) in the **head judge** and **admin moderator** views ([round-activity-log-line.tsx](../../components/common/round-activity-log-line.tsx)) — not on the event-logger workspace itself.

## Recording flow

The event logger joins with a secret code (position `EVENT_LOGGER`) and lands on the recorder. See [secret-code-access](secret-code-access.md).

1. The admin/moderator starts the round (`startRound` in [app/actions/round-timing.ts](../../app/actions/round-timing.ts)); the shared clock begins from `Round.startedAt`.
2. The logger taps an athlete tile as they pass the lap line. Each tap captures the current elapsed ms.
3. A tap routes to either `recordLapTime(athleteId, nextLap, captureMs)` or, on the final lap, `recordFinishTime(athleteId, captureMs)` — both in [app/actions/timing.ts](../../app/actions/timing.ts).
4. After the action resolves, `router.refresh()` re-reads the Server Component and the tile's 10s cooldown ring runs.
5. When every in-standing (`OK`) athlete has finished, the round auto-ends (`finalizeRoundEnd`).

Both actions require an `EVENT_LOGGER` session and an `ONGOING` round with a non-null `startedAt`, validate the athlete is active, and are idempotent against fast double-taps. `recordLapTime` advances `Round.currentLap`; `recordFinishTime` auto-assigns finish position, back-fills the final lap row, and sets `RoundAthlete.position` in a transaction. Full mechanics are in [timekeeping](timekeeping.md).

## Data shape

The recorder receives `AthleteRecord[]` (Prisma rows projected by [app/event-logger/events/[eventId]/page.tsx](../../app/event-logger/events/[eventId]/page.tsx)):

```typescript
AthleteRecord {
  bib, athleteId, name
  currentLap, lapCount          // currentLap via lapsCompleted()
  lastLapAt: string | null
  status: "OK" | "DQ" | "DNF"
  finishedAt: string | null
}
```

The `RoundActivityLog` row written by each action carries the denormalized actor/target as plain strings:

```typescript
RoundActivityLog {
  id, roundId, timestamp
  actorId, actorName, actorRole
  actionType, targetAthleteId?, targetBib?, lapNumber?
  details?, canOverride
}
```

## Activity log actionTypes

Written across [app/actions/timing.ts](../../app/actions/timing.ts), [app/actions/cards.ts](../../app/actions/cards.ts), and [app/actions/round-timing.ts](../../app/actions/round-timing.ts):

`yellow_card` | `red_card` | `red_card_confirm` | `red_card_override` | `athlete_dq` | `round_start` | `round_end` | `lap_time` | `finish_time`

## Real-time & persistence

Lap/finish writes persist to Prisma and call `revalidateRaceDayViews(eventId)` ([lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)), purging the public leaderboard cache and the race-day view paths. The event-logger page itself mounts [`AutoRefresh`](../../components/common/auto-refresh.tsx) at `2000ms` (round `SCHEDULED`) / `2500ms` (otherwise), so a second device's recordings show up shortly. Timestamps come from the server-side elapsed clock anchored to `Round.startedAt`, not the client wall clock.

## Pages

- [Event logger workspace](../pages/event-logger/workspace.md)
- [Event logger join](../pages/event-logger/join.md)

## TODOs before production

- Surface the round activity-log timeline to the event logger (currently visible only in the head-judge and moderator views)
- Handle out-of-order recording (e.g. recording a later athlete before an earlier one) more explicitly in the recorder UI

# Timekeeper

**Auth**: 6-character secret code → signed `rw_official_session` cookie (as an **Event Logger**)
**Route prefix**: none — folded into `/event-logger/events/[eventId]/...`
**Theme**: Dark

> **Status note**: there is no standalone `/timekeeper/...` route or `TIMEKEEPER` official position in the current build. The fast-tap timekeeping surface is part of the **Event Logger** workspace; timing Server Actions require the `EVENT_LOGGER` position. This doc describes that surface; see [event-logger.md](event-logger.md).

## What a timekeeper does

Records laps with a fast click-driven flow: one server-anchored race clock; tap an athlete's card to capture their next lap (or finish on the final lap). Designed for speed at a zone with many athletes passing in quick succession.

## Features used

| Feature | Notes |
|---------|-------|
| [secret-code-access](../features/secret-code-access.md) | Join via code (as Event Logger) |
| [timekeeping](../features/timekeeping.md) | Primary |

## Pages visited

- [Join](../pages/timekeeper/join.md)
- [Workspace](../pages/timekeeper/workspace.md)

## How it works

The recorder is [components/timekeeper/lap-recorder.tsx](../../components/timekeeper/lap-recorder.tsx), shared with the Event Logger workspace. Each tap calls `recordLapTime` or `recordFinishTime` in [app/actions/timing.ts](../../app/actions/timing.ts), passing the elapsed race time in ms (computed from `round.startedAt`). After a tap, that athlete's button locks for a **10-second cooldown** (a countdown ring shows the seconds left); other athletes stay tappable, and on error the cooldown is released for an immediate retry. Recording is idempotent.

## Typical workflow

1. Join via the 6-char code (lands in the Event Logger workspace).
2. Wait for the admin to start the round; the race clock begins from `round.startedAt`.
3. As each athlete passes, tap their card:
   - Before the final lap → records the lap split
   - On the final lap → records their finish (position auto-assigned by crossing order)
   - The card locks for 10 seconds, showing a countdown ring
4. The round auto-ends once every active athlete has finished (or the admin ends it).

## Timekeeper vs. event logger

In the current build these are the **same** role and surface — the timekeeper is the event logger. There is one fast-tap recorder; manual time entry was replaced by tap-to-capture against the server-anchored clock.

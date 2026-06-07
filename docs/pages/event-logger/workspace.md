# Event Logger · Workspace

**Route**: `/event-logger/events/[eventId]`
**Role**: [event-logger](../../personas/event-logger.md)
**Type**: Server page wrapping Client `LapRecorder`
**Status**: Implemented
**Code**:
- [app/event-logger/events/[eventId]/page.tsx](../../../app/event-logger/events/[eventId]/page.tsx)
- [components/timekeeper/lap-recorder.tsx](../../../components/timekeeper/lap-recorder.tsx)
- [app/actions/timing.ts](../../../app/actions/timing.ts) — `recordLapTime`, `recordFinishTime`

## Purpose

Lap-time and finish-time recording for the round. A single race-synced clock (started/ended by the moderator) plus a tap grid: one tap on an athlete records their next lap, or their finish on the final lap. The page renders the shared `LapRecorder` component (also used conceptually by the timekeeper role).

## UI Sections

1. **Event/round header** — event + round name, distance (metres), `lapCount`, logger name + zone, links to scoreboard and logout
2. **Race clock** — HH:MM:SS, driven by the server-set `startedAt` / `endedAt` (Waiting / ● Live / Ended); ticks client-side every 250ms while live
3. **Race status banner** — not-started / live / ended
4. **Athlete tap grid** — one square button per athlete in start-list order, showing the 1-based start-list number, `currentLap / lapCount`, and a colour-coded state (tappable / DQ / DNF / finished / cooling down). A 10s cooldown ring overlays the button after each tap.

## Data Displayed

The Server Component requires a valid official session (`getOfficialSession()`, position `EVENT_LOGGER`, matching `eventId`) and queries Prisma for the round, its `roundAthletes` (start-list order), `lapTimes`, `finishTimes`, and the event's `eventAthletes` for BIB lookup. Each athlete is projected to an `AthleteRecord`:

```typescript
AthleteRecord {
  bib, athleteId, name,
  currentLap,         // lapsCompleted(lapRows, hasFinish, lapCount)
  lapCount,
  lastLapAt: string | null,   // finish time if finished, else last lap split
  status: "OK" | "DQ" | "DNF",
  finishedAt: string | null
}
```

The race clock is fed by `round.startedAt` / `round.endedAt` (ISO strings); elapsed time is computed client-side as `(endMs ?? now) - startMs`.

## Actions

- Tap an athlete → `handleRecordLap`: `nextLap = currentLap + 1`. If `nextLap >= lapCount` it calls `recordFinishTime(athleteId, elapsedMs)`, otherwise `recordLapTime(athleteId, nextLap, elapsedMs)`. The captured `timeMs` is the race-elapsed time at the tap.
- Each tap starts a **10s per-athlete cooldown** (`COOLDOWN_MS`) with a countdown ring; other athletes stay tappable. On error the cooldown is released for immediate retry.
- Both Server Actions require an `EVENT_LOGGER` session and a round that is `ONGOING` with a non-null `startedAt`. They are idempotent: a duplicate lap or an already-finished athlete returns a no-op result and an info toast.
- `recordFinishTime` auto-assigns finish `position` (= count of existing finishes + 1) and, when every active athlete has finished, auto-finishes the round (toast "จบการแข่งขันอัตโนมัติ").
- Tapping before the moderator starts the race shows "รอ Admin เริ่มจับเวลาก่อน"; DQ/DNF/finished athletes are not tappable.
- Logout → `logoutOfficial()` returns to the join page.

## Features Surfaced

- [event-logging](../../features/event-logging.md) (primary)
- [timekeeping](../../features/timekeeping.md) (the lap/finish capture itself)

## State / Behavior

- Server-rendered athlete records from Prisma; the client holds the clock tick, the per-athlete cooldown map, and a transition flag.
- Lap and finish times persist to `LapTime` / `FinishTime` via Server Actions (`recordedBy = judgeId`, `source = position`), which bump `Round.currentLap` and write `RoundActivityLog` entries.
- The race clock is server-synced: it survives reload because `startedAt` / `endedAt` come from the round row, not local state.
- **Real-time:** `AutoRefresh` calls `router.refresh()` every 2000ms while `SCHEDULED`, 2500ms otherwise, so recorded laps and other roles' updates appear automatically. An `OfficialEndedDialog` opens when the round is `FINISHED`.

## TODOs

- Back-edit / correct a lap after recording (today this is done from the moderator console via `app/actions/moderator.ts`, not in this workspace)

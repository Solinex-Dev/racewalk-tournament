# Timekeeper · Workspace

**Route**: `/timekeeper/events/[eventId]` (not implemented as a separate route tree)
**Role**: [timekeeper](../../personas/timekeeper.md)
**Type**: Client `LapRecorder` (rendered under the event-logger route)
**Status**: Not implemented as a separate page — the lap-recording UI is the shared `LapRecorder`, served by the [event-logger workspace](../event-logger/workspace.md)
**Code**:
- [components/timekeeper/lap-recorder.tsx](../../../components/timekeeper/lap-recorder.tsx)
- [app/event-logger/events/[eventId]/page.tsx](../../../app/event-logger/events/[eventId]/page.tsx) (host page)
- [app/actions/timing.ts](../../../app/actions/timing.ts) — `recordLapTime`, `recordFinishTime`

## Purpose

Fast tap-driven lap recording. One race-synced clock for the whole round; tap an athlete's tile to record their next lap (or their finish on the final lap). The component file lives under `components/timekeeper/` (`LapRecorder`) but in the current app it is mounted by the **event-logger** route — there is no separate `app/timekeeper/` tree and no `TIMEKEEPER` value in `OfficialPosition`.

## UI Sections

1. **Race clock** — HH:MM:SS, driven by the server-set `startedAt` / `endedAt` (Waiting / ● Live / Ended); ticks client-side every 250ms while live. There is no local Start/Stop/Reset — the race is started and ended by the moderator.
2. **Race status banner** — not-started / live / ended
3. **Athlete tap grid** — one square button per athlete in start-list order, showing the 1-based start-list number, `currentLap / lapCount`, and a colour-coded state. A 10s cooldown ring (`COOLDOWN_MS`) overlays the tile after each tap.

## Data Displayed

Source: `AthleteRecord[]` built server-side in the event-logger page from Prisma (`roundAthletes`, `lapTimes`, `finishTimes`, `eventAthletes` for BIB):

```typescript
AthleteRecord {
  bib, athleteId, name,
  currentLap, lapCount,
  lastLapAt: string | null,
  status: "OK" | "DQ" | "DNF",
  finishedAt: string | null
}
```

The clock is fed by `raceStartedAt` / `raceEndedAt` (the round's `startedAt` / `endedAt`), so elapsed time is the real race time, identical across all roles and surviving reload.

## Actions

- Tap an athlete tile → `handleRecordLap`: `nextLap = currentLap + 1`. If `nextLap >= lapCount` → `recordFinishTime(athleteId, elapsedMs)`, else `recordLapTime(athleteId, nextLap, elapsedMs)`. `timeMs` is the race-elapsed time captured at the tap.
- Each tap starts a **10s per-athlete cooldown** with a countdown ring; other athletes stay independently tappable. On error the cooldown is released for immediate retry.
- Both Server Actions require an `EVENT_LOGGER` session and a round that is `ONGOING` with a non-null `startedAt`; they are idempotent (duplicate lap / already-finished → no-op + info toast).
- DQ/DNF/finished athletes are non-tappable; tapping before the moderator starts the race shows "รอ Admin เริ่มจับเวลาก่อน".

## Features Surfaced

- [timekeeping](../../features/timekeeping.md) (primary)

## State / Behavior

- Server-rendered athlete records; the client holds the clock tick, the per-athlete cooldown map, and a transition flag.
- Laps/finishes persist to `LapTime` / `FinishTime` via Server Actions (`recordedBy`, `source`), bump `Round.currentLap`, and write `RoundActivityLog` entries. `recordFinishTime` auto-assigns finish `position` and auto-finishes the round once all active athletes have finished.
- The race clock is server-synced (survives reload). After each write the host page's `AutoRefresh` (`router.refresh()` at 2000/2500ms) pulls fresh records.

## TODOs

- Back-edit a lap after it is recorded (handled today from the moderator console via `app/actions/moderator.ts`, not in this workspace).
- Reconcile this doc and the [timekeeper persona](../../personas/timekeeper.md) with the implemented model, where the lap keeper is the `EVENT_LOGGER` official.

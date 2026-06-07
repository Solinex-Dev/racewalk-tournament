# Timekeeping

**Status**: Implemented (merged into the Event Logger workspace)
**Roles**: [event-logger](../personas/event-logger.md) (the legacy [timekeeper](../personas/timekeeper.md) persona is served by this same flow)
**Routes**: `/event-logger/events/[eventId]` (there is no separate `/timekeeper` route in the current code)
**Entities**: `LapTime`, `FinishTime`, `RoundAthlete`, `Round` (`currentLap`)
**Related features**: [event-logging](event-logging.md) (same workspace), [live-scoreboard](live-scoreboard.md)

## Overview

Timekeeping is the **tap-driven lap/finish capture** flow. Historically the "Timekeeper" was a separate role with its own route; in the current code that flow is folded into the **Event Logger** workspace and runs under the `EVENT_LOGGER` official position. The shared component is [`LapRecorder`](../../components/timekeeper/lap-recorder.tsx) and the writes are in [app/actions/timing.ts](../../app/actions/timing.ts).

Characteristics of the recorder:

- **One shared race clock** — driven by `Round.startedAt` (set by the admin/moderator when the race begins) and frozen at `Round.endedAt`. The client ticks every 250ms; elapsed = `(endedAt ?? now) - startedAt`. A reload no longer resets it because the start time lives in the database.
- **Tap an athlete tile → record** — each tap captures the current elapsed ms and records either a lap or the finish.
- **10-second cooldown** per athlete after each tap (a countdown ring on the tile), so the same athlete can't be double-fired while other athletes stay tappable.

## Recording flow

1. Admin/moderator starts the round (`startRound` in [app/actions/round-timing.ts](../../app/actions/round-timing.ts)) — sets `status = ONGOING` and `startedAt`. The recorder's clock starts.
2. When an athlete passes the lap line, the official taps their tile. `handleRecordLap()` computes `nextLap = currentLap + 1` and `captureMs = elapsedMs`.
3. If `nextLap >= lapCount` it calls `recordFinishTime(athleteId, captureMs)`; otherwise `recordLapTime(athleteId, nextLap, captureMs)`.
4. The tile enters its 10s cooldown immediately (released on error so the official can retry). After the action resolves, `router.refresh()` re-reads the page.
5. Repeat until each athlete reaches `lapCount`. When the last in-standing (`OK`) athlete finishes, the round auto-ends.

Both actions require an `EVENT_LOGGER` official session, an `ONGOING` round with a non-null `startedAt`, and an active (non-DQ/DNF) athlete. They are **idempotent**: a duplicate lap (unique `roundId, athleteId, lapNumber`) or a second finish (unique `roundId, athleteId`) returns a benign `{ ok: true, duplicate/alreadyFinished: true }` instead of throwing.

- `recordLapTime` bumps `Round.currentLap` forward, writes the `LapTime` (`recordedBy = judgeId`, `source = position`), and logs `lap_time`.
- `recordFinishTime` auto-assigns `position = (existing finishes) + 1` (1 = first to finish), writes the `FinishTime`, back-fills the final `LapTime` if missing (so a 10-lap race shows 10/10), sets `RoundAthlete.position`, and logs `finish_time` — all in one `$transaction`. If every `OK` athlete has finished it calls `finalizeRoundEnd` ([lib/round-lifecycle.ts](../../lib/round-lifecycle.ts)).

## Data shape

The recorder receives a serializable `AthleteRecord[]` (built by the server page from Prisma rows):

```typescript
AthleteRecord {
  bib, athleteId, name
  currentLap, lapCount          // currentLap = lapsCompleted(laps, hasFinish, lapCount)
  lastLapAt: string | null      // formatted last split / finish time
  status: "OK" | "DQ" | "DNF"
  finishedAt: string | null
}
```

`currentLap` is derived via `lapsCompleted()` in [lib/lap-progress.ts](../../lib/lap-progress.ts) (lap rows + finish, clamped to `lapCount`).

## UI elements

| Element | Behavior |
|---------|----------|
| Race clock | HH:MM:SS, started by the admin's `startRound`, frozen at `endedAt` |
| Status banner | `not-started` / `live` / `ended` ([race-status-banner.tsx](../../components/common/race-status-banner.tsx)) |
| Athlete tile | Tap to record lap/finish; disabled if DQ/DNF, finished, or on cooldown |
| Cooldown ring | 10s countdown overlay (`COOLDOWN_MS = 10_000`) after each tap |
| Toasts | success/info/error via `sonner` (e.g. "บันทึก Lap N", "เข้าเส้นชัย") |

## Pages

- [Timekeeper workspace](../pages/timekeeper/workspace.md) — now the Event Logger workspace
- [Timekeeper join](../pages/timekeeper/join.md) — now the Event Logger join (`/event-logger/events/[eventId]/join`)

## TODOs before production

- Allow an official to back-edit a recorded lap after the cooldown closes (currently only the moderator can edit lap/finish times via [app/actions/moderator.ts](../../app/actions/moderator.ts))
- Handle an athlete who skips a lap (DNF mid-race) from within the recorder

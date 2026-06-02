# Timekeeping

**Status**: UI only (mock data)
**Roles**: [timekeeper](../personas/timekeeper.md)
**Routes**: `/timekeeper/events/[eventId]`
**Entities**: `AthleteState`, `LapRecord`
**Related features**: [event-logging](event-logging.md) (alternative recording mode), [live-scoreboard](live-scoreboard.md)

## Overview

The Timekeeper records laps with a **click-driven stopwatch flow**, optimized for speed at the finish-line zone:

- One single race timer running for everyone
- Click an athlete row → record one lap
- 5-second **Undo** window after each record
- Visual flash on the just-recorded row

Compared to [event-logging](event-logging.md), the timekeeper interface trades manual time entry for tap-speed. An event may use either or both interfaces.

## Recording flow

1. Timekeeper starts the race timer (one timer for the whole round).
2. When an athlete passes the lap line, timekeeper clicks their row.
3. `handleRecordLap()` increments `currentLap`, appends a `LapRecord`, flashes the row for 600ms.
4. **Undo** button appears for 5 seconds. Clicking it reverts the last lap.
5. Repeat until each athlete reaches `lapCount`.

## Data shape

```typescript
AthleteState {
  bib, name, currentLap, lapCount, lastSplit, status: "OK" | "DQ" | "DNF"
}

LapRecord {
  id, bib, name, lap, raceTime
}
```

Source: `INITIAL_ATHLETES` in [app/timekeeper/events/[eventId]/page.tsx](../../app/timekeeper/events/[eventId]/page.tsx) (7 sample athletes).

## UI elements

| Element | Behavior |
|---------|----------|
| Race timer | HH:MM:SS, started by Start button |
| Reset | Disabled while running |
| Athlete row | Click to record lap; disabled if currentLap === lapCount |
| Lap log | Append-only list of `LapRecord` |
| Undo | Appears for 5s after each record |

## Pages

- [Timekeeper workspace](../pages/timekeeper/workspace.md)
- [Timekeeper join](../pages/timekeeper/join.md)

## TODOs before production

- Persist lap records to database
- Allow timekeeper to back-edit a lap time after the undo window closes
- Sync race timer with a shared server clock (so reload doesn't reset)
- Handle athlete who skips a lap (DNF mid-race)
- Show position rankings live based on current laps + split time

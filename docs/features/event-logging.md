# Event Logging

**Status**: UI only (mock data)
**Roles**: [event-logger](../personas/event-logger.md)
**Routes**: `/event-logger/events/[eventId]`
**Entities**: `AthleteLapTime`, `ActivityLogItem`
**Related features**: [timekeeping](timekeeping.md) (alternative recording mode), [live-scoreboard](live-scoreboard.md), [card-scoring](card-scoring.md) (also logged here)

## Overview

The Event Logger records **lap times** and **finish times** manually. The interface combines:

- A stopwatch (auto-running)
- Manual time entry (text input in MM:SS or HH:MM:SS)
- An activity log of every recorded event

This is a more deliberate alternative to the [Timekeeper](timekeeping.md) workspace, which is a faster, click-driven flow. An event may use either or both.

## Recording flow

1. Logger enters or selects a bib number.
2. Logger enters a lap time (or reads it from the running stopwatch).
3. Logger clicks **Record Lap** → `alert("บันทึก Lap สำหรับ Bib X เวลา Y (mock)")`, appended to activity log.
4. When athlete crosses the finish line, logger clicks **Record Finish** → `alert("บันทึกเวลาเข้าเส้นชัยสำหรับ Bib X เวลา Y (mock)")`.

The activity log displays all actions during the round, including cards issued by judges (this page is the **single timeline view** of round events).

## Data shape

```typescript
AthleteLapTime {
  bib, name, affiliation, country?
  laps: Array<{ lapNumber, time, timestamp }>
  finishTime?, finishPosition?
  status?: "OK" | "DQ" | "DNF"
}

ActivityLogItem {
  id, timestamp, time, date?
  actor, actorId?, role
  action, actionType?, targetAthlete?, targetBib?, lapNumber?
  roundId, details?, canOverride?
}
```

## Activity log actionTypes

`yellow_card` | `red_card` | `red_card_confirm` | `red_card_override` | `round_start` | `round_end` | `lap_time` | `finish_time` | `other`

## Pages

- [Event logger workspace](../pages/event-logger/workspace.md)
- [Event logger join](../pages/event-logger/join.md)

## TODOs before production

- Persist lap times to database
- Validate that lap time format is correct before submit
- Auto-fill timestamp from server time, not client
- Handle out-of-order lap entry (logger records lap 3 before lap 2)
- Activity log should pull from a single source of truth, not be per-workspace

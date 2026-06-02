# Event Logger

**Auth**: 6-character secret code (per round, issued by admin)
**Route prefix**: `/event-logger/events/[eventId]/...`
**Theme**: Dark

## What an event logger does

Records lap times and finish times manually. Combines a running stopwatch with manual time entry — slower but more deliberate than the timekeeper interface.

An event may use **event logger only**, **timekeeper only**, or **both** (e.g. one for official record, one for live feed). See [features/event-logging](../features/event-logging.md) vs. [features/timekeeping](../features/timekeeping.md).

## Features used

| Feature | Notes |
|---------|-------|
| [secret-code-access](../features/secret-code-access.md) | Join via code |
| [event-logging](../features/event-logging.md) | Primary |
| [card-scoring](../features/card-scoring.md) | Read activity log (cards appear here too) |
| [timekeeping](../features/timekeeping.md) | View alternative mode |

## Pages visited

- [Join](../pages/event-logger/join.md)
- [Workspace](../pages/event-logger/workspace.md)

## Typical workflow

1. Join via code.
2. Toggle stopwatch on at race start.
3. As each athlete passes the lap line:
   - Read the stopwatch
   - Enter bib + lap time
   - Click Record Lap
4. At finish: click Record Finish.
5. After the round, the activity log is the official record of timings + cards.

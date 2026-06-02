# Timekeeper

**Auth**: 6-character secret code (per round, issued by admin)
**Route prefix**: `/timekeeper/events/[eventId]/...`
**Theme**: Dark

## What a timekeeper does

Records laps with a fast click-driven flow: one race timer; tap an athlete row to record their next lap. Designed for speed at a finish-line zone with many athletes passing in quick succession.

## Features used

| Feature | Notes |
|---------|-------|
| [secret-code-access](../features/secret-code-access.md) | Join via code |
| [timekeeping](../features/timekeeping.md) | Primary |

## Pages visited

- [Join](../pages/timekeeper/join.md)
- [Workspace](../pages/timekeeper/workspace.md)

## Typical workflow

1. Join via code.
2. Start the race timer at race start.
3. As each athlete passes:
   - Tap their row
   - Their lap increments, the row flashes briefly
4. If a tap was wrong, click Undo within 5 seconds.
5. Stop the timer when the round is over.

## When to use timekeeper vs. event logger

| Use timekeeper when | Use event logger when |
|--|--|
| Many athletes pass quickly | Few athletes, careful timing |
| Finish-line tap workflow | Need manual time entry / corrections |
| You trust the auto stopwatch | You read times from a separate device |

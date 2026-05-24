# Timekeeper · Workspace

**Route**: `/timekeeper/events/[eventId]`
**Role**: [timekeeper](../../personas/timekeeper.md)
**Type**: Client Component
**Code**: [app/timekeeper/events/[eventId]/page.tsx](../../../app/timekeeper/events/[eventId]/page.tsx)

## Purpose

Fast click-driven lap recording. One race timer for the whole round; tap an athlete's row to record their next lap.

## UI Sections

1. **Race timer** — HH:MM:SS, with Start/Stop and Reset (Reset disabled while running)
2. **Athlete grid** — each athlete shown with bib, name, `currentLap` / `lapCount`, last split, status
3. **Lap log** — append-only list of `LapRecord` entries (id, bib, name, lap, raceTime)
4. **Undo button** — appears for 5 seconds after each record

## Data Displayed

Source: `INITIAL_ATHLETES: AthleteState[]` — 7 sample athletes.

```typescript
AthleteState {
  bib, name, currentLap, lapCount, lastSplit: string | null, status
}
LapRecord {
  id, bib, name, lap, raceTime
}
```

## Actions

- Start / Stop race timer
- Reset timer (only when stopped)
- Click an athlete row → `handleRecordLap()`:
  - Increment `currentLap`
  - Append a `LapRecord`
  - Flash the row for 600ms
  - Show Undo button for 5 seconds
- Click Undo → `handleUndo()` reverts the last lap (decrements `currentLap`, removes last `LapRecord`)

## Features Surfaced

- [timekeeping](../../features/timekeeping.md) (primary)

## State / Behavior

- Race timer ticks via `setInterval`
- Row flash uses transient CSS class with `setTimeout` (600ms)
- Undo window managed with `setTimeout` (5s)
- A row is non-clickable when `currentLap === lapCount`

## TODOs

- Persist laps to database
- Server-synced race timer (survive reload)
- Back-edit a lap after the undo window
- Position rankings live from current laps + last split

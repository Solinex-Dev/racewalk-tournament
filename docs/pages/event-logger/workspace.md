# Event Logger · Workspace

**Route**: `/event-logger/events/[eventId]`
**Role**: [event-logger](../../personas/event-logger.md)
**Type**: Client Component
**Code**: [app/event-logger/events/[eventId]/page.tsx](../../../app/event-logger/events/[eventId]/page.tsx)

## Purpose

Manual lap-time and finish-time recording. Combines a running stopwatch with text-input fields for deliberate, accurate time entry. Also shows the full round activity log.

## UI Sections

1. **Event/round header**
2. **Round selector**
3. **Stopwatch** — HH:MM:SS, Start/Stop button
4. **Manual entry**:
   - Bib number (text input, disabled while recording)
   - Lap time (MM:SS or HH:MM:SS text input, disabled while stopwatch running)
   - Record Lap button → `alert("บันทึก Lap สำหรับ Bib X เวลา Y (mock)")`
   - Record Finish button → `alert("บันทึกเวลาเข้าเส้นชัยสำหรับ Bib X เวลา Y (mock)")`
5. **Athlete lap times** — table per athlete with their recorded laps and finish time
6. **Activity log** — timeline of all actions in this round (from all roles, including cards)

## Data Displayed

Sources (mock):
- `MOCK_EVENT_STATUS` — event metadata
- `MOCK_ATHLETES_BY_ROUND: AthleteLapTime[]` per round
- `MOCK_ACTIVITY_LOGS`

`AthleteLapTime` shape: bib, name, affiliation, laps[], finishTime?, finishPosition?, status?

## Actions

- Toggle stopwatch
- Record a lap for a specific bib
- Record finish time
- Switch round

## Features Surfaced

- [event-logging](../../features/event-logging.md) (primary)
- [card-scoring](../../features/card-scoring.md) (log includes cards)
- [timekeeping](../../features/timekeeping.md) (alternative mode view)

## State / Behavior

- All local `useState`
- Stopwatch ticks via `setInterval`
- Lap time input is disabled while stopwatch is running (forces use of stopwatch reading)

## TODOs

- Persist lap times
- Auto-fill timestamp from server clock
- Validate time format on submit
- Handle out-of-order lap entry

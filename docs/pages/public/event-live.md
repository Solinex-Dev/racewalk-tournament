# Public · Event Live Scoreboard

**Route**: `/events/[eventId]`
**Role**: [public-viewer](../../personas/public-viewer.md) (no auth)
**Type**: Server Component
**Code**: [app/events/[eventId]/page.tsx](../../../app/events/[eventId]/page.tsx)

## Purpose

The public-facing real-time view of an event. Shows all athletes, their card totals, positions, and times for the current (or selected) round.

## UI Sections

1. **Event header** — name, date, location, status
2. **Round selector** — tabs / chips for each round; highlights `currentRoundId`
3. **Lap counter** — `currentLap` / `lapCount`
4. **Elapsed timer** — running time of the current round
5. **Athlete table** — rows sorted by `position`, showing:
   - Bib, name, affiliation, country
   - Yellow/red card matrix
   - Split time, total time
   - Status (`OK` / `DQ` / `DNF`)

## Data Displayed

Source: `MOCK_PUBLIC_EVENT: Record<string, PublicEvent>` in this file.

Sample events:
- `evt-001` — Racewalk Championship 2025, 20 km, 7 athletes, 2 rounds, ongoing
- `evt-002` — Bangkok City Racewalk, 10 km, 4 athletes, finished

## Actions

Read-only. The only interaction is round selection.

## Features Surfaced

- [live-scoreboard](../../features/live-scoreboard.md) (primary)
- [card-scoring](../../features/card-scoring.md) (card display, read-only)
- [event-logging](../../features/event-logging.md) (times, read-only)
- [timekeeping](../../features/timekeeping.md) (laps, read-only)

## State / Behavior

Server-rendered. Round selection is a URL parameter or query string (not yet implemented — currently shows the first/current round).

## TODOs

- Real-time updates (WebSocket / SSE)
- Mobile layout
- Result emphasis after `finished` status (podium, medals)
- Share buttons / OG image

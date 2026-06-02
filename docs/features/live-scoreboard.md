# Live Scoreboard

**Status**: UI only (mock data)
**Roles**: [public-viewer](../personas/public-viewer.md); also viewable by every other role
**Routes**: `/events/[eventId]`, `/`
**Entities**: `PublicEvent`, `PublicRound`, public `Athlete` view
**Related features**: [card-scoring](card-scoring.md) (cards displayed), [event-logging](event-logging.md) (times displayed), [timekeeping](timekeeping.md) (laps displayed)

## Overview

The public-facing live view of an event. No authentication. Anyone with the URL can watch.

Shows for each round:

- Athletes with bib, name, affiliation, country
- Yellow and red card totals
- Current position
- Split time, total time
- Status (`OK`, `DQ`, `DNF`)
- Current lap

## Data shape

```typescript
PublicEvent {
  id, name, date, location, distance_km, status
  rounds: PublicRound[]
  currentRoundId?: string
  heat_name, lapCount, currentLap, elapsed
  athletes: PublicAthlete[]
}
```

Source: `MOCK_PUBLIC_EVENT` in [app/events/[eventId]/page.tsx](../../app/events/[eventId]/page.tsx). Two sample events:

- `evt-001` — Racewalk Championship 2025, 20 km, 7 athletes, 2 rounds, ongoing
- `evt-002` — Bangkok City Racewalk, 10 km, 4 athletes, finished

## What's shown

| Element | Source |
|---------|--------|
| Event header | event name, date, location, status |
| Round selector | rounds[] (highlights `currentRoundId`) |
| Lap counter | `currentLap` / `lapCount` |
| Elapsed time | `elapsed` |
| Athlete table | sorted by `position`, shows cards, times, status |
| Card display | reuses the [card matrix](../../components/judge/card-matrix.tsx) |

## Read-only

Public viewers cannot interact. All values are computed from other features:

- Cards come from [card-scoring](card-scoring.md)
- Times come from [event-logging](event-logging.md) and [timekeeping](timekeeping.md)
- Positions are derived from times + DQ status

## Pages

- [Public event live](../pages/public/event-live.md) — the scoreboard itself
- [Landing](../pages/public/landing.md) — entry point with link to current event

## TODOs before production

- Real-time updates (currently static mock; needs WebSocket or polling)
- SEO / OG tags so shared links preview nicely
- Mobile layout (current layout is desktop-first)
- Spectator-friendly result view after `finished` (medals, podium emphasis)

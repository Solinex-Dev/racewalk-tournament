# Round Configuration

**Status**: UI only (mock data)
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/events/[eventId]/rounds/new`, `/admin/events/[eventId]/rounds/[roundId]`
**Entities**: Round, Athlete (assigned), Judge (assigned with position)
**Related features**: [secret-code-access](secret-code-access.md), [card-scoring](card-scoring.md), [event-management](event-management.md)

## Overview

A **round** is a single race within an event. Configuring a round means choosing:

- Round metadata (name, distance, scheduled time, heat name, lap count)
- The athletes participating
- The officials and their positions (judge, head judge, event logger, timekeeper)
- Generating a unique 6-character secret code for each official

## What a round contains

```
Round
├── id, name, distance, status (scheduled | ongoing | finished)
├── heat name, scheduled time, expected end, lap count
├── athletes: Athlete[]
└── officials:
    ├── head judge × 1   → secret code
    ├── judges × N       → each gets own secret code
    ├── event logger × 1 → secret code
    └── timekeeper × 1   → secret code
```

## Judge position field

When assigning a judge to a round, the admin picks a **position**:

- `judge` — issues cards
- `head_judge` — issues cards plus confirms/overrides
- `event_logger` — records lap times manually
- `timekeeper` — records laps with stopwatch

Source: position field in [round-form.tsx](../../components/rounds/round-form.tsx).

## Secret code generation

`generateRoundSecretCode()` in [round-form.tsx](../../components/rounds/round-form.tsx) produces a 6-character code from charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `I`, `O`, `0`, `1`). Each official gets a unique code.

See [secret-code-access](secret-code-access.md) for how codes are then used.

## Form

[components/rounds/round-form.tsx](../../components/rounds/round-form.tsx). Uses:

- `MOCK_ATHLETE_OPTIONS` — pool of selectable athletes
- `MOCK_JUDGE_OPTIONS` — pool of selectable judges

## Pages

- [Round form](../pages/admin/round-form.md) — create / edit a round
- [Admin moderator](../pages/admin/moderator.md) — displays configured rounds with codes during the event

## TODOs before production

- Validate athlete eligibility (already in another round at same time?)
- Validate judge availability (one judge can't be assigned to overlapping rounds)
- Code regeneration UI (one-click without rebuilding the whole round)
- Print-friendly code slips for handing out

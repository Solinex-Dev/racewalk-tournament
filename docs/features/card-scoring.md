# Card Scoring

**Status**: UI only (mock data)
**Roles**: [judge](../personas/judge.md), [head-judge](../personas/head-judge.md), oversight by [admin](../personas/admin.md), view by [public-viewer](../personas/public-viewer.md)
**Routes**:
- `/judge/events/[eventId]` (issue cards)
- `/head-judge/events/[eventId]` (confirm/override)
- `/admin/events/[eventId]/moderator` (oversight)
- `/events/[eventId]` (read-only on scoreboard)
**Entities**: `JudgeAthleteRow`, `RedCardDetail`, `YellowCardDetail`, `AthleteSummary`
**Related features**: [round-configuration](round-configuration.md) (judge positions), [live-scoreboard](live-scoreboard.md), [event-logging](event-logging.md) (records card actions)
**Decisions**: see [decisions/](../decisions/)

## Overview

The core scoring mechanism. Judges issue **yellow cards (warnings)** and **red cards (penalties)** to athletes who violate racewalk technique. Cards aggregate across judges; 4 red cards disqualifies the athlete.

See [product/domain-rules.md](../product/domain-rules.md) for the canonical rules.

## How it works end to end

1. **Setup** — Admin configures a round with N judges via [round-configuration](round-configuration.md). Each judge gets a unique secret code.
2. **Join** — Each judge enters their code on `/judge/events/[eventId]/join`, lands on their workspace.
3. **Issue** — Judge selects an athlete row and taps a card button. The button is disabled if the per-judge limit is reached for that athlete.
4. **Aggregate** — System combines cards from all judges. The 4th red card across any judges sets the athlete to `DQ`.
5. **Confirm/override** — Head judge sees pending red cards. Confirm keeps them counted; override removes them.
6. **Display** — The card matrix is rendered everywhere the cards need to be shown: judge workspace, head judge view, moderator view, public scoreboard.

## Card limits

| Limit | Value | Scope | Source |
|-------|-------|-------|--------|
| Yellow per judge per athlete | 2 (one per symbol) | Single judge | `MAX_YELLOW` in [card-matrix.tsx](../../components/judge/card-matrix.tsx) |
| Red per judge per athlete | 1 | Single judge | Enforced at button level |
| Red total per athlete | 4 → DQ | Aggregate across judges | `MAX_RED` in [card-matrix.tsx](../../components/judge/card-matrix.tsx) |

Per-judge limits are enforced **at the issuing judge's interface**. Aggregate limits are enforced **at display/computation time**.

## Symbols

| Symbol | Meaning |
|--------|---------|
| `>` | Bent knee (งอเข่า) |
| `~` | Lifted foot (ยกเท้า) |

A judge issues a yellow or red card by tapping one of four buttons:
- ใบเตือน งอเข่า — yellow, knee
- ใบเตือน ยกเท้า — yellow, foot
- ใบแดง งอเข่า — red, knee
- ใบแดง ยกเท้า — red, foot

## Card matrix component

The visual is one shared component used everywhere cards appear: [`JudgeCardMatrix`](../../components/judge/card-matrix.tsx). It renders:

- A row of slots for yellow cards (max scales by judge count in moderator view)
- A row of slots for red cards
- Each slot shows the symbol (`>` or `~`) or is empty
- Red cards issued by "this judge" get a yellow ring (via `isFromThisJudge` on `RedCardDetail`)

## Pending red cards

Red cards may be marked pending until confirmed by the head judge. The activity log records:

- `red_card` — initial issue
- `red_card_confirm` — head judge confirmed (counts toward DQ)
- `red_card_override` — head judge cancelled (does not count)

Pending red cards appear on `/admin/events/[eventId]/moderator` with Confirm and Reject buttons.

## State management

All scoring state is currently held in component-level `useState`:

- [judge-workspace.tsx](../../components/judge/judge-workspace.tsx) — `INITIAL_ATHLETES: JudgeAthleteRow[]`
- Head judge page — `MOCK_ATHLETES_BY_ROUND`
- Moderator page — `MOCK_ATHLETES_BY_ROUND`, `MOCK_PENDING_RED_CARDS`

No global store. No real-time sync. See [architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md) for the planned shape.

## Pages that surface this feature

- [Judge workspace](../pages/judge/workspace.md) — issue cards
- [Head judge workspace](../pages/head-judge/workspace.md) — confirm / override
- [Admin moderator](../pages/admin/moderator.md) — pending-card management
- [Public event live](../pages/public/event-live.md) — read-only display

## TODOs before production

- Real-time card sync across judges (WebSocket / SSE / polling)
- Persist cards to database
- Enforce per-judge limit server-side (not just UI)
- Define exact semantics of pending vs. confirmed for DQ threshold

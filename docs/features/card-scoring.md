# Card Scoring

**Status**: Implemented
**Roles**: [judge](../personas/judge.md), [head-judge](../personas/head-judge.md), oversight by [admin](../personas/admin.md), view by [public-viewer](../personas/public-viewer.md)
**Routes**:
- `/judge/events/[eventId]` (issue cards)
- `/head-judge/events/[eventId]` (confirm/override)
- `/admin/events/[eventId]/moderator` (oversight)
- `/events/[eventId]` (read-only on scoreboard)
**Entities**: `Card` (color `YELLOW`/`RED`, symbol `LIFTED_FOOT`/`BENT_KNEE`, red `state` `PENDING`/`CONFIRMED`/`OVERRIDDEN`), `RoundAthlete` (status), `RoundActivityLog`
**Related features**: [round-configuration](round-configuration.md) (judge positions), [live-scoreboard](live-scoreboard.md), [event-logging](event-logging.md) (records card actions)
**Decisions**: see [decisions/](../decisions/)

## Overview

The core scoring mechanism. Judges issue **yellow cards (warnings/notes)** and **red cards (penalties)** to athletes who violate racewalk technique. Cards aggregate across judges; **4 confirmed red cards** disqualifies the athlete.

See [product/domain-rules.md](../product/domain-rules.md) for the canonical rules.

## How it works end to end

1. **Setup** — Admin configures a round with N judges via [round-configuration](round-configuration.md). Each official gets a unique 6-character secret code.
2. **Join** — Each judge enters their code on `/judge/events/[eventId]/join`; a signed official-session cookie is set and they land on their workspace. See [secret-code-access](secret-code-access.md).
3. **Issue** — Judge taps a card button on an athlete. The button is disabled once the per-judge limit for that athlete/symbol is reached, and the action is re-checked server-side.
4. **Aggregate** — Cards persist to the `Card` table. A red card starts `PENDING`.
5. **Confirm/override** — Head judge sees pending red cards. Confirm keeps them counted (`CONFIRMED`); override drops them (`OVERRIDDEN`). The 4th **confirmed** red sets the athlete to `DQ`.
6. **Display** — The card matrix is rendered everywhere cards appear: judge workspace, head judge view, moderator view, public scoreboard.

## Where the logic lives

| Concern | File |
|---------|------|
| Issue / confirm / override (Server Actions) | [app/actions/cards.ts](../../app/actions/cards.ts) |
| Moderator corrections (delete/confirm/reject/edit) | [app/actions/moderator.ts](../../app/actions/moderator.ts) |
| Display constants + visual | [components/judge/card-matrix.tsx](../../components/judge/card-matrix.tsx) |
| Judge issuing UI | [components/judge/judge-workspace.tsx](../../components/judge/judge-workspace.tsx) |
| Public glyph mapping | [lib/leaderboard.ts](../../lib/leaderboard.ts) |

Writes are `"use server"` Server Actions. Each guards the round/athlete state, mutates `Card` via Prisma, appends a `RoundActivityLog` row, and calls `revalidateRaceDayViews(eventId)` ([lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)) so the public board and all official workspaces pick up the change on their next poll.

## Card limits

| Limit | Value | Scope | Enforced in |
|-------|-------|-------|-------------|
| Yellow per symbol per judge per athlete | 1 (→ 2 total, one per symbol) | Single judge | `issueYellowCard` counts existing `YELLOW`+symbol+judge; rejects at `>= 1` |
| Red per judge per athlete | 1 | Single judge | `issueRedCard` counts non-`OVERRIDDEN` reds for that judge; rejects at `>= 1` |
| Confirmed red total per athlete | 4 → DQ | Aggregate across judges | `confirmRedCard` / moderator confirm (`RED_CARDS_TO_DQ = 4`) |

`MAX_YELLOW = 2` and `MAX_RED = 4` in `card-matrix.tsx` drive the display slots; `RED_CARDS_TO_DQ = 4` is the DQ threshold, defined independently in both `cards.ts` and `moderator.ts`. Per-judge limits are enforced **server-side** in the Server Action (the UI only disables buttons as a hint).

Cards can only be issued while the round is `ONGOING`, the athlete is not `DQ`/`DNF`, and the athlete has not finished (`assertAthleteNotFinished` throws once a `FinishTime` exists). All three checks live in [lib/official-round-guards.ts](../../lib/official-round-guards.ts) / `cards.ts`.

## Symbols

| Enum | Glyph | Meaning |
|------|-------|---------|
| `BENT_KNEE` | `>` | Bent knee (เข่างอ / งอเข่า) |
| `LIFTED_FOOT` | `~` | Lifted foot (ยกเท้า) |

A judge issues a card by tapping one of four buttons (yellow knee, yellow foot, red knee, red foot). Yellow cards are immediate notes with no `state` and never contribute to DQ; red cards start `PENDING`.

## Card matrix component

The visual is one shared component used everywhere cards appear: [`JudgeCardMatrix`](../../components/judge/card-matrix.tsx). It renders:

- A column of `MAX_YELLOW = 2` yellow slots (hidden via `hideYellow`).
- A grid of red slots — `effectiveMaxRed = maxRed ?? MAX_RED(4)`; moderator view passes a larger `maxRed` so it can scale by judge count.
- Each filled red slot shows its symbol glyph (`>` or `~`).
- Red cards issued by "this judge" get a yellow ring (`isFromThisJudge` on `RedCardDetail`).

## Pending red cards & DQ

Red cards follow `PENDING → CONFIRMED | OVERRIDDEN`. Head-judge actions in `cards.ts` require an `HEAD_JUDGE` official session and an `ONGOING` round:

- **`confirmRedCard`** — atomic `updateMany` PENDING→CONFIRMED (sets `decidedBy`/`decidedAt`); a racing double-click flips 0 rows and returns `{ ok: true, alreadyDecided: true }`. On a real transition it counts confirmed reds; at `>= 4` it sets `RoundAthlete.status = "DQ"` and logs `athlete_dq`. If that DQ leaves no racers on the field, it auto-ends the round (`finalizeRoundEnd`).
- **`rejectRedCard`** — atomic PENDING→OVERRIDDEN; OVERRIDDEN reds do not count toward DQ and free the judge to re-issue.

The `RoundActivityLog` records: `yellow_card`, `red_card` (initial issue, `canOverride: true`), `red_card_confirm`, `red_card_override`, and `athlete_dq`. Pending red cards appear on `/admin/events/[eventId]/moderator` with Confirm and Reject buttons; the moderator path (`moderator.ts`) provides the same transitions plus delete and edit (delete of a confirmed red that drops the count below 4 reverts `DQ → OK`). Only `CONFIRMED` reds are shown on the public board.

## State & data flow

Scoring state is persisted in the `Card` table and read back by each Server Component (judge/head-judge/moderator pages query Prisma directly). There is no client-side global store: after an action resolves, the workspace calls `router.refresh()` and the page also auto-refreshes (see below). The public scoreboard reflects card changes through the leaderboard cache (purged on every card write). See [architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md).

**Real-time:** official workspaces mount [`AutoRefresh`](../../components/common/auto-refresh.tsx) at `2000ms` when the round is `SCHEDULED`, else `2500ms` (`router.refresh()` re-runs the Server Component query). The public board client-polls the cached JSON endpoint at 5s — see [live-scoreboard](live-scoreboard.md).

## Pages that surface this feature

- [Judge workspace](../pages/judge/workspace.md) — issue cards
- [Head judge workspace](../pages/head-judge/workspace.md) — confirm / override
- [Admin moderator](../pages/admin/moderator.md) — pending-card management
- [Public event live](../pages/public/event-live.md) — read-only display

# Judge

**Auth**: 6-character secret code (per round, issued by admin)
**Route prefix**: `/judge/events/[eventId]/...`
**Theme**: Dark

## What a judge does

A judge stands beside the racewalk course in an assigned sector and watches athletes for two technique faults: **bent knee** (`>`) and **lifted foot** (`~`). When they observe a fault, they issue a card.

## Per-judge limits

- **Yellow**: max 2 per athlete (one per symbol)
- **Red**: max 1 per athlete (any symbol)

Aggregate across all judges, the 4th red on an athlete results in DQ. See [features/card-scoring](../features/card-scoring.md).

## Features used

| Feature | Notes |
|---------|-------|
| [secret-code-access](../features/secret-code-access.md) | Join via code |
| [card-scoring](../features/card-scoring.md) | Issue yellow / red cards |

## Pages visited

- [Join](../pages/judge/join.md)
- [Workspace](../pages/judge/workspace.md)

## Typical workflow

1. Receive code from admin (often on a printed slip).
2. Open `/judge/events/[eventId]/join`, enter code.
3. On workspace, tap athlete row → tap one of the four card buttons.
4. Buttons disable themselves when the per-judge limit is reached for that athlete.
5. Continue until round ends.

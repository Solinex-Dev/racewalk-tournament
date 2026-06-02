# Domain Rules

This is the single source of truth for racewalk rules as encoded in the system. Every feature that touches scoring references this doc.

## The two infractions

A racewalker must maintain two technical requirements at all times. Violations are signalled by judges:

| Symbol | Thai | English | Meaning |
|--------|------|---------|---------|
| `>` | งอเข่า | **Bent knee** | The advancing leg's knee was bent at the moment of passing under the body |
| `~` | ยกเท้า | **Lifted foot** | Both feet were off the ground simultaneously (loss of contact) |

Each card carries one of these two symbols.

**Implementation:** `RedCardSymbol = "~" | ">"` in [card-matrix.tsx](../../components/judge/card-matrix.tsx).

## Card types

### Yellow card (ใบเตือน — warning)

A judge's notice to the athlete that their technique is borderline. It carries no scoring weight on its own — it is a record that the judge observed a problem.

- A single judge may issue **at most 2 yellow cards per athlete**, one per symbol (`>` and `~`).
- Yellow cards do **not** disqualify, regardless of how many judges issue them.

**Constant:** `MAX_YELLOW = 2` in [card-matrix.tsx](../../components/judge/card-matrix.tsx).

### Red card (ใบแดง — penalty)

A judge's formal call that the athlete violated the rule. Red cards aggregate across judges.

- A single judge may issue **at most 1 red card per athlete**, regardless of symbol.
- An athlete is **disqualified (DQ)** upon receiving the **4th red card** from any combination of judges.

**Constants:** `MAX_RED = 4` in [card-matrix.tsx](../../components/judge/card-matrix.tsx).

## Athlete status

| Status | Meaning |
|--------|---------|
| `OK` | Active or finished within rules |
| `DQ` | Disqualified — reached 4 red cards |
| `DNF` | Did not finish |

## Aggregation across judges

When displaying total card counts (e.g. the public scoreboard or the head judge's view), the system shows the sum across all judges in a round.

The per-judge limits are enforced at the judge's own interface: a judge cannot issue a 3rd yellow or 2nd red to the same athlete. Cross-judge totals are computed by the system.

In the head judge's matrix, the cards a particular judge issued are visually distinguished from those issued by others (`isFromThisJudge` flag on `RedCardDetail`).

**Display scaling:** in the moderator view, the displayed maximums scale with the number of judges in the round: `displayedMaxYellow = judges × 2`, `displayedMaxRed = judges × 1`.

## Round structure

An **event** contains one or more **rounds**. Each round has its own:

- Distance
- Heat name
- Scheduled time and expected end
- Lap count and current lap
- Set of athletes
- Set of judges (with positions: judge, head judge, event logger)
- Status: `scheduled` | `ongoing` | `finished`

**Event status:** `draft` | `scheduled` | `ongoing` | `finished`.

A `draft` event is not yet visible publicly. `ongoing` events appear on the live scoreboard.

## Red card override

Red cards can be **confirmed** or **overridden** by the head judge. The activity log records both confirmations and overrides as separate `actionType` values:

- `red_card` — original issue
- `red_card_confirm` — head judge confirmed
- `red_card_override` — head judge cancelled

This means a "pending" red card does not count toward DQ until it has been confirmed (or the system treats it as confirmed by default — exact behavior is a [pending decision](../decisions/README.md)).

## Related docs

- [features/card-scoring.md](../features/card-scoring.md) — how cards are issued and aggregated end-to-end
- [glossary.md](glossary.md) — full term list
- [decisions/](../decisions/) — why these limits and rules were chosen

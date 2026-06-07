# Domain Rules

This is the single source of truth for racewalk rules as encoded in the system. Every feature that touches scoring references this doc.

**Status: Implemented.** Display constants live in [card-matrix.tsx](../../components/judge/card-matrix.tsx); the rules below are enforced in the Server Actions [app/actions/cards.ts](../../app/actions/cards.ts) (judge/head-judge) and [app/actions/moderator.ts](../../app/actions/moderator.ts) (moderator corrections).

## The two infractions

A racewalker must maintain two technical requirements at all times. Violations are signalled by judges:

| Symbol | Thai | English | Meaning |
|--------|------|---------|---------|
| `>` | งอเข่า | **Bent knee** | The advancing leg's knee was bent at the moment of passing under the body |
| `~` | ยกเท้า | **Lifted foot** | Both feet were off the ground simultaneously (loss of contact) |

Each card carries one of these two symbols.

**Implementation:** the `CardSymbol` enum is `LIFTED_FOOT` (`~`) | `BENT_KNEE` (`>`) in [prisma/schema.prisma](../../prisma/schema.prisma); the display type `RedCardSymbol = "~" | ">"` is in [card-matrix.tsx](../../components/judge/card-matrix.tsx). The glyph mapping lives in [lib/leaderboard.ts](../../lib/leaderboard.ts) (`BENT_KNEE → ">"`, `LIFTED_FOOT → "~"`).

## Card types

### Yellow card (ใบเตือน — warning)

A judge's notice to the athlete that their technique is borderline. It carries no scoring weight on its own — it is a record that the judge observed a problem.

- A single judge may issue **at most 1 yellow card per symbol per athlete** — so at most 2 total (`>` and `~`). Enforced in `issueYellowCard` ([app/actions/cards.ts](../../app/actions/cards.ts)), which rejects a duplicate `(color: YELLOW, symbol, judgeId)`.
- Yellow cards are immediate — **no head-judge confirmation, no `state`** — and never contribute to DQ, regardless of how many judges issue them.

**Constant:** `MAX_YELLOW = 2` in [card-matrix.tsx](../../components/judge/card-matrix.tsx).

### Red card (ใบแดง — penalty)

A judge's formal call that the athlete violated the rule. Red cards aggregate across judges.

- A single judge may issue **at most 1 red card per athlete**, regardless of symbol. Enforced in `issueRedCard` ([app/actions/cards.ts](../../app/actions/cards.ts)); an `OVERRIDDEN` red frees that judge to re-issue.
- A new red is created in state `PENDING` and only counts once **confirmed** by the head judge.
- An athlete is **disqualified (DQ)** upon reaching **4 confirmed red cards** across judges. The threshold `RED_CARDS_TO_DQ = 4` is enforced in [app/actions/cards.ts](../../app/actions/cards.ts) (and duplicated in [app/actions/moderator.ts](../../app/actions/moderator.ts)).

**Constant:** `MAX_RED = 4` in [card-matrix.tsx](../../components/judge/card-matrix.tsx).

## Athlete status

| Status | Meaning |
|--------|---------|
| `OK` | Active or finished within rules |
| `DQ` | Disqualified — reached 4 confirmed red cards (auto), or a moderator post-race ruling (`dqReasonCode`) |
| `DNF` | Did not finish |

`AthleteRoundStatus` is stored on `RoundAthlete` ([prisma/schema.prisma](../../prisma/schema.prisma)).

## Aggregation across judges

When displaying total card counts (e.g. the public scoreboard or the head judge's view), the system shows the sum across all judges in a round. The public board counts all non-deleted yellow cards and only `RED` cards in state `CONFIRMED` ([lib/leaderboard.ts](../../lib/leaderboard.ts)); `PENDING`/`OVERRIDDEN` reds are excluded from the public total.

The per-judge limits are enforced server-side in the issuing action: a judge cannot issue a 2nd card of the same yellow symbol, nor a 2nd active red, to the same athlete. Cross-judge totals are computed by the system.

In the head judge's matrix, the cards a particular judge issued are visually distinguished from those issued by others (`isFromThisJudge` flag on `RedCardDetail`, rendered with a yellow ring in [card-matrix.tsx](../../components/judge/card-matrix.tsx)).

**Display scaling:** in the moderator view, the displayed maximums scale with the number of judges in the round: `displayedMaxYellow = judges × 2`, `displayedMaxRed = judges × 1` (passed via the `maxRed` prop to `JudgeCardMatrix`).

## Round structure

An **event** contains one or more **rounds**. Each round has its own:

- Distance (`distanceKm`, stored in km; the UI presents/accepts metres via [lib/distance.ts](../../lib/distance.ts))
- Heat name
- Scheduled time and expected end
- Lap count and current lap (`currentLap`, advanced only forward by lap/finish recording)
- Set of athletes (`RoundAthlete`, a fixed start-list with `sortOrder`)
- Set of officials, with positions: `JUDGE`, `HEAD_JUDGE`, `EVENT_LOGGER` (`RoundOfficial`)
- Status: `SCHEDULED` | `ONGOING` | `FINISHED`

**Event status:** `DRAFT` | `SCHEDULED` | `ONGOING` | `FINISHED`. Event status is derived from its rounds (`syncEventStatus` in [lib/round-lifecycle.ts](../../lib/round-lifecycle.ts)): any round `ONGOING` → event `ONGOING`; all rounds `FINISHED` → event `FINISHED`.

A `DRAFT` event is not yet visible publicly. `ONGOING` events appear on the live scoreboard.

> Note: there is no `TIMEKEEPER` value in the `OfficialPosition` enum. Timekeeper exists as an app route/role but shares the `EVENT_LOGGER` recording path ([components/timekeeper/lap-recorder.tsx](../../components/timekeeper/lap-recorder.tsx)); lap/finish actions require an `EVENT_LOGGER` session.

## Round start / stop

- **Start** (`startRound`, [app/actions/round-timing.ts](../../app/actions/round-timing.ts)): captures `startedAt` ≈ gun time, requires at least one of each official (`HEAD_JUDGE`, `JUDGE`, `EVENT_LOGGER`), and sets the round `ONGOING`.
- **End** (`endRound`, same file → `finalizeRoundEnd` in [lib/round-lifecycle.ts](../../lib/round-lifecycle.ts)): sets `FINISHED` and stamps `endedAt` (the single source of truth for elapsed time). The round can also **auto-end**: when the last athlete finishes (all OK athletes have a finish time) or a DQ removes the last racer from the field.

## Red card override

A new red card is created `PENDING` and does not count toward DQ until the head judge resolves it. The lifecycle is `PENDING → CONFIRMED | OVERRIDDEN` (`RedCardState`):

- **`confirmRedCard`** ([app/actions/cards.ts](../../app/actions/cards.ts)) — atomic `PENDING → CONFIRMED`, idempotent on double-click. If confirmed reds reach 4, sets the athlete `DQ`; if that empties the field, auto-ends the round.
- **`rejectRedCard`** ([app/actions/cards.ts](../../app/actions/cards.ts)) — atomic `PENDING → OVERRIDDEN`; overridden reds never count toward DQ and free that judge to re-issue.
- The moderator can confirm/reject/delete/edit cards as a head-judge fallback ([app/actions/moderator.ts](../../app/actions/moderator.ts)); deleting a confirmed red that drops the count below 4 reverts a `DQ` back to `OK`.

The per-round activity timeline (`RoundActivityLog`) records these with `actionType` values:

- `red_card` — original issue (`canOverride: true`)
- `red_card_confirm` — head judge confirmed
- `red_card_override` — head judge cancelled
- `athlete_dq` — athlete reached 4 confirmed reds

## Related docs

- [features/card-scoring.md](../features/card-scoring.md) — how cards are issued and aggregated end-to-end
- [glossary.md](glossary.md) — full term list
- [decisions/](../decisions/) — why these limits and rules were chosen

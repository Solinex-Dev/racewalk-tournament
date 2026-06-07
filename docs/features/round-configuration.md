# Round Configuration

**Status**: Implemented
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/events/[eventId]/rounds/new`, `/admin/events/[eventId]/rounds/[roundId]`
**Entities**: `Round`, `RoundAthlete` (start list), `RoundOfficial` (position + secret code)
**Code**: [app/actions/rounds.ts](../../app/actions/rounds.ts), [components/rounds/round-form.tsx](../../components/rounds/round-form.tsx)
**Related features**: [secret-code-access](secret-code-access.md), [card-scoring](card-scoring.md), [event-management](event-management.md)

## Overview

A **round** is a single race within an event. Configuring a round means choosing:

- Round metadata (name, distance, scheduled/expected-end time, lap count, note)
- The athletes participating (its start list)
- The officials and their positions (judge, head judge, event logger)
- A unique 6-character secret code per official, used to join their workspace

## What a round contains

Backed by the Prisma `Round` model plus two join tables (`RoundAthlete`, `RoundOfficial`):

```
Round (id, name, status: SCHEDULED | ONGOING | FINISHED)
├── distanceKm?, scheduledTime?, expectedEndTime?, lapCount?, note?
├── startedAt? / endedAt?   (set by round start/stop — see below)
├── start list: RoundAthlete[]   (sortOrder = start-list order)
└── officials: RoundOfficial[]
    ├── head judge × 1   → secret code
    ├── judges × ≤8      → each gets own secret code
    └── event logger × 1 → secret code
```

> Distance is stored in **km** on `distanceKm` (a `String`) but the form works in **metres**, converting at the boundary via `lib/distance.ts`. Athletes drawn into a round must already be registered on the event (`EventAthlete`); the start-list `sortOrder` drives the lap keeper's sequential numbering. BIB lives on `EventAthlete`, not `RoundAthlete`.

## Official positions

When assigning an official to a round, the admin picks a **position** (`OfficialPosition` enum):

- `JUDGE` — issues yellow/red cards
- `HEAD_JUDGE` — issues cards plus confirms/overrides red cards
- `EVENT_LOGGER` — records lap and finish times

Per-round caps (`round-form.tsx` and mirrored in `app/actions/rounds.ts`): **`MAX_JUDGES = 8`**, **`MAX_HEAD_JUDGE = 1`**, **`MAX_EVENT_LOGGER = 1`** (10 officials max). There is **no `TIMEKEEPER`** position in the schema — the Timekeeper exists as a separate route/role, but a round's officials are only JUDGE / HEAD_JUDGE / EVENT_LOGGER. To **start** a round (any non-`SCHEDULED` status) the round must have at least one of each (`assertStartableOfficials`).

Source: position field in [round-form.tsx](../../components/rounds/round-form.tsx).

## Secret code generation

`generateSecretCode()` in [round-form.tsx](../../components/rounds/round-form.tsx) produces a 6-character code from charset `SECRET_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (no `I`, `O`, `0`, `1`). It uses **`crypto.getRandomValues`** (Web Crypto, cryptographically secure) over a `Uint8Array(6)`; since 256 is a multiple of 32 there is no modulo bias. `genUniqueSecret(used)` retries (≤50) to avoid collisions within the form and against other rounds. Codes are auto-filled when officials are added (fill order: JUDGE → HEAD_JUDGE → EVENT_LOGGER).

Codes are stored on `RoundOfficial.secretCode`. The DB enforces `@@unique([roundId, secretCode])`, but because rounds can run simultaneously and the join matches a code within the whole **event**, `assertEventUniqueSecretCodes` (in `app/actions/rounds.ts`) guards uniqueness **event-wide** (within the submission and against every other non-deleted round).

See [secret-code-access](secret-code-access.md) for how codes are then used to join.

## Form

[components/rounds/round-form.tsx](../../components/rounds/round-form.tsx) is a controlled client form. Selectable athletes come from the event's registered athletes; selectable officials come from the live judge pool — both passed in from the Server Component as real data (no mock pools).

On submit it calls the **Server Actions** `createRound` / `updateRound` in [app/actions/rounds.ts](../../app/actions/rounds.ts):

- Both require `requirePermission("events", "create" | "edit")`.
- Validations run before the write: official caps (`assertOfficialLimits`), startable-officials (when not `SCHEDULED`), event-wide unique secret codes, round-within-event window and no-schedule-conflict (`lib/scheduling.ts`), and that every athlete is registered on the event.
- A **live (`ONGOING`) round is locked** — `updateRound` throws; mid-race corrections go through the Moderator tool instead.
- The round, its `RoundAthlete` start list, and its `RoundOfficial` rows are written in one `prisma.$transaction`; edits soft-delete then upsert each child so removals/reordering are atomic. Duplicate-data `P2002` becomes a friendly Thai message.
- Logs `ROUND_CREATED` / `ROUND_UPDATED` via `logCurrentAdmin`, then `revalidatePath("/admin/events/[eventId]")` and `redirect`s back to the event.

Round **start/stop** (which sets `startedAt` / `endedAt` and drives the auto-DQ and auto-finish lifecycle) is a separate concern handled by `app/actions/round-timing.ts` (`startRound` / `endRound`, gated on `moderator:view`). See [card-scoring](card-scoring.md) and [timekeeping](timekeeping.md).

## Pages

- [Round form](../pages/admin/round-form.md) — create / edit a round
- [Admin moderator](../pages/admin/moderator.md) — displays configured rounds with codes during the event

## TODOs before production

- Code regeneration UI (one-click reroll of a single official's code without rebuilding the round).
- Print-friendly code slips for handing out at the venue.

# Admin · Moderator

**Route**: `/admin/events/[eventId]/moderator`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component (with client `ModeratorView`)
**Status**: Implemented
**Code**:
- [app/admin/(pages)/events/[eventId]/moderator/page.tsx](../../../app/admin/(pages)/events/[eventId]/moderator/page.tsx)
- [components/moderator/moderator-view.tsx](../../../components/moderator/moderator-view.tsx)
- [app/actions/round-timing.ts](../../../app/actions/round-timing.ts) (start/end round — the only writes this page makes)

## Purpose

The admin's **live control room** during an event. Combines event status, round/athlete oversight, judge config, pending card management, and an activity timeline — the most feature-dense page in the system.

## UI Sections

1. **Event status header** — name, date, location, status (scheduled / ongoing / finished), with a live elapsed timer for the current round
2. **Round tabs** — switch between rounds; per round, start/end controls
3. **Athletes by round** — per-round table with the [card matrix](../../../components/judge/card-matrix.tsx); rows are finish-order sorted (`lib/athlete-sort.ts`, same ordering as the public board); max yellow/red slots scale with judge count
4. **Judges panel** — assigned officials, their positions and zones
5. **Pending red cards** — read-only list of `PENDING` reds; confirm/reject is **not** done on this page (the UI links out to the Head Judge workspace, or to Moderator Edit for corrections)
6. **Activity log** — per-round timeline, merging card issuance (derived from `Card` rows) with `RoundActivityLog` entries (start/end, laps, finishes, DQ, moderator corrections)
7. Link to **Moderator Edit** (correction mode) — see [moderator-edit.md](moderator-edit.md)

## Data Displayed

The Server Component queries Prisma (`prisma.event.findUnique`) for the event with its rounds and, per round, the `roundAthletes` (+ athlete/affiliation), `roundOfficials` (+ judge name/zone), non-deleted `cards` (+ athlete/judge), `lapTimes`, `finishTimes`, and `activityLogs`. BIB is read from the event-level `eventAthletes` map. Access is gated by `getCurrentAdmin()` + `hasPermission(me, "moderator", "view")`; missing permission renders `<NoAccess />`. `DRAFT` events redirect back to the event detail page.

## Actions

- Switch round
- **Start round** → `startRound(roundId)` (`app/actions/round-timing.ts`); requires ≥1 head judge, ≥1 judge, ≥1 event logger; sets `startedAt` ≈ gun time and flips the event to `ONGOING`
- **End round** → `endRound(roundId)` (delegates to `finalizeRoundEnd`)
- Open the Moderator Edit page → `/admin/events/[eventId]/moderator/edit`

This page itself only starts/ends rounds — it does **not** confirm/reject red cards. Confirming/rejecting a pending red happens on the [Head Judge workspace](../head-judge/workspace.md) (`confirmRedCard`/`rejectRedCard` in `app/actions/cards.ts`, auto-DQ at 4 confirmed reds). Deeper corrections — including a moderator-side confirm/reject plus edit/delete of laps, finishes, card symbols, and athlete status — live on the [Moderator Edit](moderator-edit.md) page via `app/actions/moderator.ts` (`moderatorConfirmRedCard`/`moderatorRejectRedCard`, etc.).

## Features Surfaced

- [event-management](../../features/event-management.md) (status oversight, round start/end)
- [round-configuration](../../features/round-configuration.md) (view + edit link)
- [secret-code-access](../../features/secret-code-access.md) (codes issued in the round form)
- [card-scoring](../../features/card-scoring.md) (oversight + pending queue)
- [event-logging](../../features/event-logging.md) (activity timeline)
- [reporting-export](../../features/reporting-export.md) (via the report page)

## State / Behavior

- This is intentionally the **single page admin keeps open during the race**
- `ModeratorView` polls with `setInterval(() => router.refresh(), 10_000)` (10s) to surface new pending cards and card updates, and ticks a 1s live elapsed timer
- Writes call the relevant Server Action, then `router.refresh()`; the actions also `revalidatePath`/`revalidateTag` the race-day + public views (`lib/revalidate-race-day.ts`)

## TODOs

- Print-friendly view for code distribution at the venue

# Admin · Moderator Edit (Correction Mode)

**Route**: `/admin/events/[eventId]/moderator/edit?round=[roundId]`
**Role**: [admin](../../personas/admin.md)
**Type**: Server page with client `ModeratorEditView`
**Status**: Implemented
**Code**:
- [app/admin/(pages)/events/[eventId]/moderator/edit/page.tsx](../../../app/admin/(pages)/events/[eventId]/moderator/edit/page.tsx)
- [components/moderator/moderator-edit-view.tsx](../../../components/moderator/moderator-edit-view.tsx)
- [app/actions/moderator.ts](../../../app/actions/moderator.ts) (write path)

## Purpose

The admin's **correction console** for a single round: review and fix race data that the on-field officials entered — cards, lap times, finish times, finish positions, athlete status (DQ/DNF/OK), and round metadata. This is *not* where judges or secret codes are assigned (that is the [round form](round-form.md)).

## UI Sections

- **Round selector** — choose which round to correct (via `?round=`)
- **Athletes** — finish-order sorted (`lib/athlete-sort.ts`); per athlete: status, position, DQ reason code
- **Judges accordion** — scoring officials (zone judges, then head judge) as headings for their issued cards; the event logger is excluded (handled in the Lap/Finish sections)
- **Cards** — every non-deleted card with judge, zone, color, symbol, state
- **Lap times** and **Finish times** — editable / deletable rows
- **Activity log** — recent `RoundActivityLog` entries (last 100), including moderator corrections

## Data Displayed

The Server Component queries Prisma for the selected round's `roundAthletes` (+ athlete), `roundOfficials` (+ judge), non-deleted `cards`, `lapTimes`, `finishTimes`, and `activityLogs` (latest 100), plus the event-level `eventAthletes` for the BIB map. Access is gated by `getCurrentAdmin()` + `hasPermission(me, "moderator", "view")`; missing permission renders `<NoAccess />`. `DRAFT` events redirect to the event detail page.

## Actions

All actions are Server Actions in `app/actions/moderator.ts`, each gated by `requirePermission("moderator", "view")`, each writing a `RoundActivityLog` correction entry, and each followed by `router.refresh()`:

- `moderatorEditCard` / `moderatorDeleteCard` — edit (judge/color/symbol/time) or soft-delete a card; deleting a confirmed red below the DQ threshold reverts DQ→OK
- `moderatorConfirmRedCard` / `moderatorRejectRedCard` — head-judge-fallback PENDING→CONFIRMED/OVERRIDDEN; confirm auto-DQs at 4 confirmed reds
- `moderatorEditLapTime` / `moderatorDeleteLapTime`
- `moderatorEditFinishTime` / `moderatorEditFinishPosition` / `moderatorDeleteFinishTime`
- `moderatorOverrideAthleteStatus` — set OK / DQ / DNF (with reason)
- `moderatorEditRoundInfo` — name / distance / lap count / `startedAt` / `endedAt` (rejects `endedAt < startedAt`)

Each action also invalidates the race-day + public views via `lib/revalidate-race-day.ts`.

## Features Surfaced

- [card-scoring](../../features/card-scoring.md) (card corrections + red-card review)
- [event-logging](../../features/event-logging.md) (lap/finish/status corrections + audit trail)
- [event-management](../../features/event-management.md) (round metadata corrections)

## TODOs

- (none outstanding — judge/code assignment intentionally lives in the [round form](round-form.md), not here)

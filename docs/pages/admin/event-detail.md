# Admin · Event Detail (Create / Edit)

**Routes**:
- `/admin/events/new` (create)
- `/admin/events/[eventId]` (edit)

**Role**: [admin](../../personas/admin.md)
**Type**: Server page wrapping Client `EventForm`
**Status**: Implemented
**Code**:
- [app/admin/(pages)/events/new/page.tsx](../../../app/admin/(pages)/events/new/page.tsx)
- [app/admin/(pages)/events/[eventId]/page.tsx](../../../app/admin/(pages)/events/[eventId]/page.tsx)
- [components/events/event-form.tsx](../../../components/events/event-form.tsx)
- [app/actions/events.ts](../../../app/actions/events.ts) (write path)

## Purpose

Create a new event or edit an existing one. Both routes share the same `EventForm` component. The edit page also lists the event's rounds and links to round/moderator/report tooling.

## UI Sections

1. Page header with breadcrumb
2. **Event form** (`EventForm`):
   - Name
   - Start time (`datetime-local`) and optional end time
   - Location
   - Distance — entered in **metres** in the UI, converted to km on save (storage column is `distanceKm`)
   - Lap count
   - Status (`DRAFT` / `SCHEDULED` / `ONGOING` / `FINISHED`)
   - **Registered athletes** — picker modal over all athletes, with a per-athlete BIB field (BIB is event-scoped, reused across all rounds)
3. Save / Cancel buttons (the edit view is read-only until "แก้ไข" is pressed; the edit button only shows when the admin has `events:edit`)
4. **Rounds list** (`RoundsList`) — each round with athlete/official counts and links into the round form
5. Audit info (`AuditInfo`) — created/updated by + timestamps, resolved via `lib/audit.ts`

## Data Displayed

The Server Component queries Prisma directly (`prisma.event.findUnique`) for the event with its rounds (`_count` of round athletes/officials) and its `eventAthletes` (with BIB and `sortOrder`), plus the global athlete list for the picker. Stored `distanceKm` is converted to metres for display via `lib/distance.ts`. Access is gated by `getCurrentAdmin()` + `hasPermission(me, "events", "view")`; missing permission renders `<NoAccess />`.

## Actions

- Edit fields, save:
  - Create → `createEvent(payload)` then `router.push` to the new event's edit page
  - Edit → `updateEvent(eventId, payload)` then `router.refresh()`
  - Both are Server Actions in `app/actions/events.ts`, gated by `requirePermission("events", create|edit)`, which persist via Prisma and write an admin `ActivityLog`
- Add/remove registered athletes and set their BIBs
- Navigate to nested config (rounds, moderator, report)

## Validation (client + server)

- End time may not precede start time
- Every registered athlete must have a valid age-encoded BIB (`[age band][3-digit seq]`, e.g. `65001`) — checked client-side (`parseBibAgeGroup`) and re-validated server-side (`assertValidBibs` → `lib/bib.ts`)
- Duplicate BIBs within the event are flagged in red; the DB also enforces `@@unique([eventId, bib])`

## Features Surfaced

- [event-management](../../features/event-management.md) (primary)
- [round-configuration](../../features/round-configuration.md) (linked via rounds list)
- [reporting-export](../../features/reporting-export.md) (linked)

## TODOs

- Confirm before save when status changes from `SCHEDULED` → `ONGOING` (an `ONGOING` round is locked from edits)

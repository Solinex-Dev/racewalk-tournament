# Event Management

**Status**: Implemented
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/events`, `/admin/events/new`, `/admin/events/[eventId]`
**Entities**: `Event`, `EventAthlete` (registrations + BIB)
**Code**: [app/actions/events.ts](../../app/actions/events.ts), [app/admin/(pages)/events/page.tsx](../../app/admin/(pages)/events/page.tsx), [components/events/event-form.tsx](../../components/events/event-form.tsx)
**Related features**: [round-configuration](round-configuration.md), [reporting-export](reporting-export.md), [live-scoreboard](live-scoreboard.md)

## Overview

Admins create, list, edit, and delete **events**. An event is the top-level competition entity — one date, one location, one set of rounds. Registering athletes (with their event-scoped BIB) is also done here, on the event form.

## Event entity

Backed by the Prisma `Event` model (`prisma/schema.prisma`):

```typescript
Event {
  id: string;            // cuid
  name: string;
  date: DateTime;        // calendar day (midnight), derived from startTime
  startTime: DateTime?;
  endTime: DateTime?;
  location: string;
  distanceKm: string;    // stored in km (String, not numeric)
  lapCount: number;      // default lap count for new rounds (default 1)
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "FINISHED";
  // standard audit/soft-delete columns: createdAt, updatedAt,
  // deletedAt?, createdById?, updatedById?
}
```

Each registered athlete is an `EventAthlete` row: `{ eventId, athleteId, bib, sortOrder }`, unique per `(eventId, athleteId)` and per `(eventId, bib)`. **BIB is event-scoped** — the same BIB is reused across all rounds in the event. See [round-configuration](round-configuration.md), where athletes are drawn into a round's start list.

> Note: distance is stored in **kilometres** on `distanceKm` (a `String`), but the UI presents and accepts **metres** — `event-form.tsx` converts at the form boundary via `lib/distance.ts`.

## Event status lifecycle

```
DRAFT → SCHEDULED → ONGOING → FINISHED
```

| Status | Visible on public scoreboard | Editable | Notes |
|--------|------------------------------|----------|-------|
| `DRAFT` | No | Yes | Admin-only |
| `SCHEDULED` | Yes (list / pre-race board) | Yes | Rounds can be configured |
| `ONGOING` | Live | Yes (but a live round is locked) | Cards being issued |
| `FINISHED` | History | Yes | Results exportable |

Event status is **derived from round status** rather than set by hand: `syncEventStatus(eventId)` (`lib/round-lifecycle.ts`) promotes the event to `ONGOING` when any round is `ONGOING`, and to `FINISHED` when every round is `FINISHED`. Starting a round (`app/actions/round-timing.ts`) therefore moves the event to `ONGOING` automatically. The admin dashboard "current activity" section lists events with `status: ONGOING`.

## Pages

- [Events list](../pages/admin/events-list.md) — `/admin/events`
- [Event detail / edit](../pages/admin/event-detail.md) — `/admin/events/[eventId]`
- New event — `/admin/events/new` (uses the same `EventForm` as edit)

The list page is a Server Component that reads `prisma.event.findMany({ where: { deletedAt: null }, orderBy: { date: "desc" } })`. It is a shared hub: admins with `events:*`, `moderator:view`, or `reports:view` all reach it and each sees their own row actions (edit / Moderator / Report).

## Form

[components/events/event-form.tsx](../../components/events/event-form.tsx). Fields: name, start time, end time, location, distance (metres), default lap count, status, and the athlete registration list (athlete + BIB per row, drag-to-reorder for `sortOrder`).

On submit the form calls the **Server Actions** `createEvent` / `updateEvent` in [app/actions/events.ts](../../app/actions/events.ts):

- Both require permission via `requirePermission("events", "create" | "edit")` (`lib/authz.ts`).
- `assertValidBibs` rejects malformed BIBs server-side — a BIB must parse as `[age band][3-digit sequence]` (e.g. `65001`), via `parseBibAgeGroup` in `lib/bib.ts`. The form blocks it too; this is defense in depth.
- `Event.date` is derived from the `startTime` input (first 10 chars = the calendar day) so all day-based scheduling/display logic keeps working.
- The event and its `EventAthlete` rows are written in a single `prisma.$transaction`. On edit, current registrations are soft-deleted then each submitted athlete is upserted (handles removals, BIB changes, and reordering atomically).
- A duplicate BIB (`@@unique([eventId, bib])`, Prisma `P2002`) is rethrown as a friendly Thai message.
- Each action writes an admin audit row (`ActivityLogAction.EVENT_CREATED` / `EVENT_UPDATED`) via `logCurrentAdmin`, then calls `revalidatePath("/admin/events")` (and `/admin/events/[id]` on edit).

## TODOs before production

- Cascade behaviour when deleting an event with rounds/results (events use the standard soft-delete `deletedAt`, but cascade rules for child rounds/results are not yet defined here).
- Auto-promote `SCHEDULED` → `ONGOING` at the scheduled time without an explicit round start.

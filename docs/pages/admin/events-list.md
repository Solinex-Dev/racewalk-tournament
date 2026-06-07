# Admin · Events List

**Status**: Implemented (Prisma-backed)

**Route**: `/admin/events`
**Role**: [admin](../../personas/admin.md) (reachable by event managers, Moderator-only, and Reports-only admins — each sees their own row actions)
**Type**: Server Component, Client `EventsList`
**Code**:
- [app/admin/(pages)/events/page.tsx](../../../app/admin/(pages)/events/page.tsx)
- [components/events/events-list.tsx](../../../components/events/events-list.tsx)

## Purpose

Listing of all events with status badges and per-row actions. This list is a shared hub: admins with `events:*`, `moderator:view`, or `reports:view` all reach it (otherwise `<NoAccess />`), and each just sees the row buttons their permissions allow.

## UI Sections

1. **Page header** with "+ สร้าง Event ใหม่" button → `/admin/events/new` (shown only with `events:create`)
2. **Filters panel** ([events-list.tsx](../../../components/events/events-list.tsx)): client-side search (name / location / date / distance), status filter, location filter, and a date filter (none / single / range)
3. **Events table**:
   - Name (with a pulsing **LIVE** badge while ONGOING), date, location, distance (shown in **metres**, converted from the stored km via `metersFromKm`), status badge
   - Row actions, each permission-gated:
     - 3-dot menu (non-draft events): open public event page, copy the judge join link
     - Edit → `/admin/events/[eventId]` (`events:view`)
     - Report → `/admin/events/[eventId]/report` (`reports:view`, non-draft only)
     - Moderator → `/admin/events/[eventId]/moderator` (`moderator:view`, non-draft only)
   - Pagination (10 per page)

## Data Displayed

Source: live Prisma query (`prisma.event.findMany` where `deletedAt: null`, ordered by date desc). Each row carries id, name, date, location, `distanceKm` (a **string**, stored in km), and status (`draft` / `scheduled` / `ongoing` / `finished`).

## Actions

- Edit / Moderator / Report / open-public-page / copy-judge-link — all client-side navigation (or new-tab links)
- Filtering, search, date-range, and pagination are handled client-side in `EventsList`

## Features Surfaced

- [event-management](../../features/event-management.md) (primary)
- [reporting-export](../../features/reporting-export.md) (Report action)

## TODOs

- Server-side pagination / search if the event count grows large (currently the full list is loaded and filtered client-side)
- Sortable columns

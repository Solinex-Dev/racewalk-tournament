# Admin · Dashboard

**Route**: `/admin` (in route group `(pages)`)
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component
**Code**: [app/admin/(pages)/page.tsx](../../../app/admin/(pages)/page.tsx)

## Purpose

Landing page after admin login. Shows high-level stats and a quick link to the current event.

## UI Sections

1. **Stats cards** — total events, total judges, total athletes
2. **Current event card** — name, date, status, link to moderator view
3. **Quick links / navigation aids**

## Data Displayed

Aggregated counts from the database. The "current activity" section lists events with `status: ONGOING`.

## Actions

Navigation only.

## Features Surfaced

- [event-management](../../features/event-management.md) (entry point)
- Implicit entry to all CRUD features via the sidebar

## TODOs

- Real counts from database
- Activity feed across all events
- Permission-gated tiles (score officer sees fewer)

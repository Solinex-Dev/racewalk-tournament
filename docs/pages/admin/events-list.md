# Admin · Events List

**Route**: `/admin/events`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component
**Code**: [app/admin/(pages)/events/page.tsx](../../../app/admin/(pages)/events/page.tsx)

## Purpose

Listing of all events with status badges and per-row actions.

## UI Sections

1. **Page header** with "New event" button → `/admin/events/new`
2. **Events table**:
   - Name, date, location, distance, status badge
   - Row actions: Edit → `/admin/events/[eventId]`, Moderator → `/admin/events/[eventId]/moderator`, Report → `/admin/events/[eventId]/report`

## Data Displayed

Source: `MOCK_EVENTS: AdminEvent[]` — 22 sample events from Dec 2024 to Dec 2025.

```typescript
AdminEvent {
  id, name, date, location, distance_km,
  status: "draft" | "scheduled" | "ongoing" | "finished",
}
```

## Actions

- Click row → edit event
- Click status row chips to filter (planned)
- New event button

## Features Surfaced

- [event-management](../../features/event-management.md) (primary)
- [reporting-export](../../features/reporting-export.md) (Report action)

## TODOs

- Filter by status
- Sort by date
- Search by name
- Pagination if events grow large

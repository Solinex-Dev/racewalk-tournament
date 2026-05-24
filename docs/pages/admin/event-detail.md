# Admin · Event Detail (Create / Edit)

**Routes**:
- `/admin/events/new` (create)
- `/admin/events/[eventId]` (edit)

**Role**: [admin](../../personas/admin.md)
**Type**: Server page wrapping Client `EventForm`
**Code**:
- [app/admin/(pages)/events/new/page.tsx](../../../app/admin/(pages)/events/new/page.tsx)
- [app/admin/(pages)/events/[eventId]/page.tsx](../../../app/admin/(pages)/events/[eventId]/page.tsx)
- [components/events/event-form.tsx](../../../components/events/event-form.tsx)

## Purpose

Create a new event or edit an existing one. Both routes share the same form component.

## UI Sections

1. Page header with breadcrumb
2. **Event form**:
   - Name
   - Date
   - Location
   - Distance (km)
   - Status (draft / scheduled / ongoing / finished)
3. Save / Cancel buttons
4. Nested management:
   - Link to Rounds
   - Link to Moderator config
   - Link to Report export

## Data Displayed

For edit: the event row from `MOCK_EVENTS` keyed by `[eventId]`.

## Actions

- Edit fields, save → `console.log` + `alert("mock save")`
- Navigate to nested config

## Features Surfaced

- [event-management](../../features/event-management.md) (primary)
- [round-configuration](../../features/round-configuration.md) (linked)
- [reporting-export](../../features/reporting-export.md) (linked)

## TODOs

- API integration
- Form validation
- Confirm before save when status changes from `scheduled` → `ongoing` (locks rounds)

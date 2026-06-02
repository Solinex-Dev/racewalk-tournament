# Event Management

**Status**: UI only (mock data)
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/events`, `/admin/events/new`, `/admin/events/[eventId]`
**Entities**: `AdminEvent`
**Related features**: [round-configuration](round-configuration.md), [reporting-export](reporting-export.md), [live-scoreboard](live-scoreboard.md)

## Overview

Admins create, list, edit, and delete **events**. An event is the top-level competition entity — one date, one location, one set of rounds.

## Event entity

```typescript
{
  id: string;
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
}
```

Source: `MOCK_EVENTS` in [app/admin/(pages)/events/page.tsx](../../app/admin/(pages)/events/page.tsx) (22 sample events).

## Event status lifecycle

```
draft → scheduled → ongoing → finished
```

| Status | Visible on public scoreboard | Editable | Notes |
|--------|------------------------------|----------|-------|
| `draft` | No | Yes | Admin-only |
| `scheduled` | List view | Limited | Locked once participants are configured |
| `ongoing` | Live | No (read during race) | Cards being issued |
| `finished` | History | No | Read-only; results exportable |

The admin dashboard "current activity" section lists events with `status: ongoing`.

## Pages

- [Events list](../pages/admin/events-list.md) — `/admin/events`
- [Event detail / edit](../pages/admin/event-detail.md) — `/admin/events/[eventId]`
- New event — `/admin/events/new` (uses same `EventForm` as edit)

## Form

[components/events/event-form.tsx](../../components/events/event-form.tsx). Fields: name, date, location, distance.

On submit (mock): currently `console.log` + `alert`. Real API call: `POST /api/events` or `PUT /api/events/[id]`.

## TODOs before production

- Persist events to database
- Status transitions wired to real timing (auto-promote `scheduled` → `ongoing` at start time?)
- Cascade behavior when deleting an event with rounds/results
- Permission checks (which admin level can delete?)

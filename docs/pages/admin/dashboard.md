# Admin · Dashboard

**Status**: Implemented (Prisma-backed)

**Route**: `/admin` (in route group `(pages)`)
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component (`export const dynamic = "force-dynamic"`)
**Code**: [app/admin/(pages)/page.tsx](../../../app/admin/(pages)/page.tsx)

## Purpose

Landing page after admin login. Shows high-level stats and surfaces any event that is currently ONGOING with a quick link to its Moderator and Live views.

## UI Sections

1. **Stats cards** — total events, total judges, total athletes (all counts exclude soft-deleted rows)
2. **"กิจกรรมที่กำลังดำเนินการ" section** — one card per ONGOING event (supports multiple simultaneous races), showing name, date, location, athlete/judge counts, and links to the Moderator tool and the public Live page. When no event is ONGOING, an empty-state card links to `/admin/events`.

## Data Displayed

Live aggregated counts from the database, fetched in parallel (`Promise.all`):
- `prisma.event.count` / `prisma.judge.count` / `prisma.athlete.count` (where `deletedAt: null`)
- `prisma.event.findMany` where `status: ONGOING`, with nested rounds → round athletes / officials, from which the per-event athlete and judge counts are computed as **unique** ids across rounds.

The page is rendered with `dynamic = "force-dynamic"` so it always reflects live ONGOING status rather than a stale cached render.

## Actions

Navigation only. The "Moderator" link is shown only when the viewer has `moderator:view` permission; "เปิดหน้า Live" links to the public scoreboard at `/events/[eventId]`.

## Features Surfaced

- [event-management](../../features/event-management.md) (entry point)
- Implicit entry to all CRUD features via the sidebar

## TODOs

- Activity feed across all events
- Permission-gated stat tiles (currently all three counts are always shown)

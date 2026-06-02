# Public · Landing

**Route**: `/`
**Role**: [public-viewer](../../personas/public-viewer.md) (no auth)
**Type**: Server Component
**Code**: [app/page.tsx](../../../app/page.tsx)

## Purpose

The entry point for spectators and officials. Introduces the system and links to:

- The current event's live scoreboard (if any)
- The judge join flow (for officials following a printed code slip)

## UI Sections

1. Hero block with brand
2. Call-to-action: "Watch current event" → `/events/[eventId]`
3. Secondary link: "I'm a judge" → `/judge/events/[eventId]/join`

## Data Displayed

Static copy. No mock data.

## Actions

Navigation only — clicks lead to other routes.

## Features Surfaced

- [live-scoreboard](../../features/live-scoreboard.md) (entry point)
- [secret-code-access](../../features/secret-code-access.md) (entry point)

## TODOs

- Auto-detect current event and link to it
- Multi-event list view at `/events`
- Language toggle visible from landing

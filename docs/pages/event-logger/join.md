# Event Logger · Join

**Route**: `/event-logger/events/[eventId]/join`
**Role**: [event-logger](../../personas/event-logger.md)
**Type**: Server page wrapping a Client form
**Status**: Implemented
**Code**:
- [app/event-logger/events/[eventId]/join/page.tsx](../../../app/event-logger/events/[eventId]/join/page.tsx)
- [components/judge/event-logger-join-form.tsx](../../../components/judge/event-logger-join-form.tsx)
- [app/actions/officials.ts](../../../app/actions/officials.ts) — `joinAsOfficial`

## Purpose

Take a 6-character secret code from an event logger, validate it server-side, and issue the signed official session cookie that routes them to the event-logger (lap-time) workspace.

## UI Sections

Same pattern as [judge/join](../judge/join.md), branded for the lap-time keeper (คนเก็บ Lap Time). The Server Component loads the event via Prisma and passes `{ id, name, statusLabel }` to the form; a missing event disables submit.

## Actions

- Enter 6-char code → submit → `joinAsOfficial(eventId, code)` Server Action → on success `router.push(result.redirect)`.
- Validation is the shared `joinAsOfficial` flow: rate-limited (10/IP/event/min), exact-6-char, matched against `RoundOfficial.secretCode` for a round in this event, FINISHED-round-aware. The matched official's `position` (`EVENT_LOGGER`) drives `defaultRouteForPosition` → `/event-logger/events/{eventId}`.

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md)

## TODOs

- (none outstanding — server validation and routing are implemented)

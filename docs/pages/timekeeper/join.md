# Timekeeper · Join

**Route**: `/timekeeper/events/[eventId]/join` (not implemented as a separate route tree)
**Role**: [timekeeper](../../personas/timekeeper.md)
**Type**: —
**Status**: Not implemented as a separate page — folded into the [event-logger](../event-logger/join.md) join flow
**Code**:
- [app/actions/officials.ts](../../../app/actions/officials.ts) — `joinAsOfficial` (shared)
- [components/judge/event-logger-join-form.tsx](../../../components/judge/event-logger-join-form.tsx) (equivalent join form)

## Purpose

In the current implementation there is **no standalone timekeeper route**. The lap-timing role on race day is `EVENT_LOGGER` (see `OfficialPosition` — its values are `JUDGE`, `HEAD_JUDGE`, `EVENT_LOGGER`; there is no `TIMEKEEPER`). Lap-keeping is reached through the [event-logger join](../event-logger/join.md), which issues the same signed official session cookie.

## UI Sections

Same pattern as [judge/join](../judge/join.md) / [event-logger/join](../event-logger/join.md): a Server page loads the event from Prisma and renders a 6-slot OTP form.

## Actions

- Enter 6-char code → `joinAsOfficial(eventId, code)` Server Action → server matches the `RoundOfficial.secretCode`, reads its `position`, and routes via `defaultRouteForPosition`. A code assigned to an `EVENT_LOGGER` lands on `/event-logger/events/{eventId}`.

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md)

## TODOs

- Reconcile the [timekeeper persona](../../personas/timekeeper.md) and [timekeeping feature](../../features/timekeeping.md) docs with the implemented model, where the lap keeper is the `EVENT_LOGGER` official rather than a distinct timekeeper route/position.

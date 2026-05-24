# Event Logger · Join

**Route**: `/event-logger/events/[eventId]/join`
**Role**: [event-logger](../../personas/event-logger.md)
**Type**: Server page wrapping a Client form
**Code**:
- [app/event-logger/events/[eventId]/join/page.tsx](../../../app/event-logger/events/[eventId]/join/page.tsx)
- [components/judge/event-logger-join-form.tsx](../../../components/judge/event-logger-join-form.tsx)

## Purpose

Take a 6-character secret code from an event logger and route them to the event-logger workspace.

## UI Sections

Same pattern as [judge/join](../judge/join.md).

## Actions

- Enter 6-char code → `router.push("/event-logger/events/{eventId}")`

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md)

## TODOs

- Server-side validation

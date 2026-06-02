# Timekeeper · Join

**Route**: `/timekeeper/events/[eventId]/join`
**Role**: [timekeeper](../../personas/timekeeper.md)
**Type**: Server page wrapping a Client form
**Code**:
- [app/timekeeper/events/[eventId]/join/page.tsx](../../../app/timekeeper/events/[eventId]/join/page.tsx)
- [components/timekeeper/timekeeper-join-form.tsx](../../../components/timekeeper/timekeeper-join-form.tsx)

## Purpose

Take a 6-character secret code from a timekeeper and route them to the timekeeper workspace.

## UI Sections

Same pattern as [judge/join](../judge/join.md).

## Actions

- Enter 6-char code → `router.push("/timekeeper/events/{eventId}")`
- Demo code `"111111"` resolves here when entered on the judge join form too (for shared demo flow)

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md)

## TODOs

- Server-side validation

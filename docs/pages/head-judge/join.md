# Head Judge · Join

**Route**: `/head-judge/events/[eventId]/join`
**Role**: [head-judge](../../personas/head-judge.md)
**Type**: Server page wrapping a Client form
**Code**:
- [app/head-judge/events/[eventId]/join/page.tsx](../../../app/head-judge/events/[eventId]/join/page.tsx)
- [components/judge/head-judge-join-form.tsx](../../../components/judge/head-judge-join-form.tsx)

## Purpose

Take a 6-character secret code from a head judge and route them to the head-judge workspace.

## UI Sections

Identical pattern to [judge/join](../judge/join.md), with head-judge branding.

## Data Displayed

Source: `MOCK_EVENT_INFO[eventId]` in the join page.

## Actions

- Enter 6-char code → submit → `router.push("/head-judge/events/{eventId}")`

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md) (primary)

## TODOs

- Server-side code validation
- Distinguish a head-judge code from a regular judge code at validation time

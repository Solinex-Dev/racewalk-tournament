# Head Judge · Join

**Route**: `/head-judge/events/[eventId]/join`
**Role**: [head-judge](../../personas/head-judge.md)
**Type**: Server page wrapping a Client form
**Status**: Implemented
**Code**:
- [app/head-judge/events/[eventId]/join/page.tsx](../../../app/head-judge/events/[eventId]/join/page.tsx)
- [components/judge/head-judge-join-form.tsx](../../../components/judge/head-judge-join-form.tsx)
- [app/actions/officials.ts](../../../app/actions/officials.ts) — `joinAsOfficial`

## Purpose

Take a 6-character secret code from a head judge, validate it server-side, and issue the signed official session cookie that routes them to the head-judge workspace.

## UI Sections

Identical pattern to [judge/join](../judge/join.md), with head-judge branding (หัวหน้ากรรมการ).

## Data Displayed

The page is a Server Component: it queries Prisma for the event (`prisma.event.findUnique`, `deletedAt: null`) and passes `{ id, name, statusLabel }` (Thai-labelled `EventStatus`) to the client form. A missing event disables submit.

## Actions

- Enter 6-char code → submit → `joinAsOfficial(eventId, code)` Server Action → on success `router.push(result.redirect)`.
- The same `joinAsOfficial` flow validates the code against `RoundOfficial.secretCode` for a round in this event and reads the official's `position` from the matched row, so a head-judge code resolves to the head-judge workspace via `defaultRouteForPosition` — no separate code-type branch is needed at validation time. (Rate-limited, length-checked, FINISHED-round-aware, as on [judge/join](../judge/join.md).)

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md) (primary)

## TODOs

- (none outstanding — server validation routes by the stored `RoundOfficial.position`, so head-judge vs regular-judge codes are distinguished automatically)

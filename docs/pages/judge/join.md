# Judge · Join

**Route**: `/judge/events/[eventId]/join`
**Role**: [judge](../../personas/judge.md)
**Type**: Server page wrapping a Client form
**Status**: Implemented
**Code**:
- [app/judge/events/[eventId]/join/page.tsx](../../../app/judge/events/[eventId]/join/page.tsx)
- [components/judge/judge-join-form.tsx](../../../components/judge/judge-join-form.tsx)
- [app/actions/officials.ts](../../../app/actions/officials.ts) — `joinAsOfficial`
- [lib/official-session.ts](../../../lib/official-session.ts) — signed cookie

## Purpose

Take a 6-character secret code from a judge, validate it server-side against the round's `RoundOfficial` rows, and issue a signed official session cookie that routes them to their workspace.

## UI Sections

1. Brand / event header (กรรมการ)
2. Event info card (name + Thai status label)
3. 6-character OTP input ([`InputOTP`](https://github.com/guilhermerodz/input-otp), `REGEXP_ONLY_DIGITS_AND_CHARS`, auto-uppercased)
4. Submit button (disabled until length === 6, or if the event was not found)
5. Inline error banner (shown when the code is rejected)

## Data Displayed

The page is a Server Component: it queries Prisma for the event (`prisma.event.findUnique`, `deletedAt: null`) and passes `{ id, name, statusLabel }` to the client form. `statusLabel` maps `EventStatus` (DRAFT/SCHEDULED/ONGOING/FINISHED) to Thai. If no event is found the form renders a "ไม่พบข้อมูล Event" notice and disables submit.

## Actions

- Enter 6-char code → submit
- On submit the client form calls the `joinAsOfficial(eventId, code)` Server Action (in a `useTransition`) — there is no client-side route table; the destination comes from the server.
- Server validation (`app/actions/officials.ts`):
  - Rate-limited to 10 attempts per IP per event per minute (`lib/rate-limit.ts`); over the limit returns a Thai "try again later" error.
  - Code trimmed/uppercased and must be exactly 6 chars.
  - Looks up a non-deleted `RoundOfficial` whose `secretCode` matches **and** whose round belongs to this event. Unknown code → "รหัสกรรมการไม่ถูกต้องสำหรับ Event นี้"; a FINISHED round → rejected.
  - On success: `setOfficialSessionCookie(...)` signs a `rw_official_session` JWT (jose, HS256 over `NEXTAUTH_SECRET`, 12h TTL) and returns the redirect from `defaultRouteForPosition(position, eventId)`.
- On `result.ok` the client `router.push(result.redirect)`; otherwise it shows the returned error.

The same `joinAsOfficial` flow is shared by the head-judge and event-logger join forms — `defaultRouteForPosition` sends each official to the workspace matching their `RoundOfficial.position`, so entering a head-judge code here still lands on the head-judge workspace.

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md) (primary)

## State / Behavior

- Server-side code validation and rate limiting are implemented.
- Inline error messaging covers invalid/expired codes and rate-limit hits.

## TODOs

- (none outstanding — server validation, error messaging, and rate limiting are all in place)

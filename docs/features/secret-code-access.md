# Secret Code Access

**Status**: Implemented
**Roles**: Issued by [admin](../personas/admin.md); used by [head-judge](../personas/head-judge.md), [judge](../personas/judge.md), [event-logger](../personas/event-logger.md) (the [timekeeper](../personas/timekeeper.md) persona joins via the Event Logger flow)
**Routes**:
- `/judge/events/[eventId]/join`
- `/head-judge/events/[eventId]/join`
- `/event-logger/events/[eventId]/join`
**Entities**: `RoundOfficial` (holds `secretCode`, `position`, `zone`), official-session JWT cookie
**Related features**: [round-configuration](round-configuration.md) (codes generated here)
**Decisions**: see [decisions/](../decisions/) (charset choice, length, lifetime)

## Overview

Non-admin race-day officials do not have accounts. They join a specific event/round by entering a **6-character secret code** the admin generated for them. On a valid code the server sets a signed session cookie and redirects them to the workspace for their position. The code resolves:

- **Which event** they join (the event ID is in the URL; the code must belong to a round of that event).
- **Which round** within that event they are assigned to (`RoundOfficial.roundId`).
- **Which position** they occupy (`JUDGE`, `HEAD_JUDGE`, or `EVENT_LOGGER`).

The same person can be issued different codes for different events or rounds — there is no persistent user identity for non-admin roles. (There is no separate Timekeeper position in the schema; that role joins as `EVENT_LOGGER`.)

## Why codes instead of accounts

- Officials at a competition are temporary participants. Creating accounts for each one is overhead with no benefit.
- Codes can be printed and handed out at the venue.
- A lost code can be regenerated without account recovery flows.
- Public viewers need no auth at all — they just open the scoreboard URL.

## Code format

| Property | Value |
|----------|-------|
| Length | 6 characters |
| Character set | `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars; no ambiguous `I`/`O`/`0`/`1`) |
| Input pattern | `REGEXP_ONLY_DIGITS_AND_CHARS` ([input-otp](https://github.com/guilhermerodz/input-otp)), uppercased |

## Code generation

Implemented in [round-form.tsx](../../components/rounds/round-form.tsx) as `generateSecretCode()` / `genUniqueSecret()`. It uses **`crypto.getRandomValues`** (Web Crypto, cryptographically secure) over a `Uint8Array(6)`, mapping `bytes[i] % 32` onto `SECRET_CHARS` (256 is a multiple of 32 → no modulo bias), and retries (≤50) to avoid collisions within the form and against other rounds in the event.

One code is auto-assigned per official per round, stored on `RoundOfficial.secretCode`. Per-round caps are `MAX_JUDGES = 8`, `MAX_HEAD_JUDGE = 1`, `MAX_EVENT_LOGGER = 1` (10 officials max). The DB enforces `@@unique([roundId, secretCode])`, and the round Server Action ([app/actions/rounds.ts](../../app/actions/rounds.ts), `assertEventUniqueSecretCodes`) additionally guards uniqueness **event-wide** (so simultaneously-running rounds can't collide on a code). See [round-configuration](round-configuration.md).

## Join flow

The join is a Server Action, [`joinAsOfficial(eventId, secretCode)`](../../app/actions/officials.ts) — validation is fully server-side:

1. User opens `/<role>/events/[eventId]/join` (URL shared by admin or printed on the code slip).
2. User enters the 6-character code via [`InputOTP`](https://github.com/guilhermerodz/input-otp); submit is disabled until length 6.
3. The form calls `joinAsOfficial`, which **rate-limits** the request (max `JOIN_MAX_ATTEMPTS = 10` per IP per event per `JOIN_WINDOW_MS = 60_000` via [lib/rate-limit.ts](../../lib/rate-limit.ts)), trims/uppercases the code, and rejects anything not exactly 6 chars.
4. It looks up the `RoundOfficial` whose `secretCode` matches **and** whose round belongs to this event. Unknown code → "รหัสกรรมการไม่ถูกต้องสำหรับ Event นี้"; a `FINISHED` round → rejected.
5. On success it calls `setOfficialSessionCookie({ officialId, judgeId, judgeName, roundId, eventId, position, zone })` and returns a redirect from `defaultRouteForPosition(position, eventId)`.
6. The client `router.push()`es to that workspace.

## Official session cookie

The session is a signed JWT cookie, not a NextAuth session. Two modules:

- [lib/official-jwt.ts](../../lib/official-jwt.ts) — edge-safe `jose` primitives (no `next/headers`), so they run in middleware and Server Actions. Cookie `rw_official_session`; `OFFICIAL_COOKIE_TTL_SECONDS = 60 * 60 * 12` (12h); HS256 signed over `NEXTAUTH_SECRET`; payload `{ officialId, judgeId, judgeName, roundId, eventId, position, zone }`.
- [lib/official-session.ts](../../lib/official-session.ts) — the `next/headers` cookie layer: `setOfficialSessionCookie` (`httpOnly`, `sameSite: "lax"`, `secure` in prod), `clearOfficialSessionCookie`, `getOfficialSession`, and `requireOfficialSession(positions?)` which every official Server Action calls to enforce its allowed position.

The middleware ([proxy.ts](../../proxy.ts)) slides the cookie on official routes (verify every request, re-sign only in the last ~25% of TTL) so an open, polling workspace never lapses; it truly expires only after ~12h of inactivity. `logoutOfficial()` in [officials.ts](../../app/actions/officials.ts) clears the cookie, and `leaveOfficialSession()` in [app/actions/official-session.ts](../../app/actions/official-session.ts) clears it and redirects to the public live page when an official confirms the end-of-round dialog.

## Each role's join form

| Form | File |
|------|------|
| Judge | [judge-join-form.tsx](../../components/judge/judge-join-form.tsx) |
| Head Judge | [head-judge-join-form.tsx](../../components/judge/head-judge-join-form.tsx) |
| Event Logger | [event-logger-join-form.tsx](../../components/judge/event-logger-join-form.tsx) |

All three follow the same pattern with role-specific copy, and all submit through the same `joinAsOfficial` action.

## Pages that surface this feature

- [Judge join](../pages/judge/join.md)
- [Head judge join](../pages/head-judge/join.md)
- [Event logger join](../pages/event-logger/join.md)
- [Admin moderator](../pages/admin/moderator.md) — displays codes
- [Admin round form](../pages/admin/round-form.md) — generates codes

## TODOs before production

- Code expiry tied to the event window (codes are currently valid until the round is `FINISHED`, bounded only by the 12h session TTL)
- Code revocation (admin invalidates a single code without regenerating the whole round)

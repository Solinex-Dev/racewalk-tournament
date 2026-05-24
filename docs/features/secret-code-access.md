# Secret Code Access

**Status**: UI only (mock data)
**Roles**: Issued by [admin](../personas/admin.md); used by [head-judge](../personas/head-judge.md), [judge](../personas/judge.md), [event-logger](../personas/event-logger.md), [timekeeper](../personas/timekeeper.md)
**Routes**:
- `/judge/events/[eventId]/join`
- `/head-judge/events/[eventId]/join`
- `/event-logger/events/[eventId]/join`
- `/timekeeper/events/[eventId]/join`
**Entities**: `Round` (holds codes), per-user assignment
**Related features**: [round-configuration](round-configuration.md) (codes generated here)
**Decisions**: see [decisions/](../decisions/) (charset choice, length, lifetime)

## Overview

Non-admin users do not have accounts. They join a specific event/round by entering a **6-character secret code** the admin generated for them. The code determines:

- **Which event** they join (event ID is in the URL).
- **Which round** within that event they are assigned to.
- **Which role** they occupy (judge, head judge, event logger, timekeeper).

This means the same person can be issued different codes for different events or rounds — there is no persistent user identity for non-admin roles.

## Why codes instead of accounts

- Officials at a competition are temporary participants. Creating accounts for each one is overhead with no benefit.
- Codes can be printed and handed out at the venue.
- A lost code can be regenerated without account recovery flows.
- Public viewers need no auth at all — they just open the scoreboard URL.

## Code format

| Property | Value |
|----------|-------|
| Length | 6 characters |
| Character set | Alphanumeric (digits + A–Z) |
| Input pattern | `REGEXP_ONLY_DIGITS_AND_CHARS` ([input-otp](https://github.com/guilhermerodz/input-otp)) |

The charset specifically excludes ambiguous characters (the constant `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` in `generateRoundSecretCode()` skips `I`, `O`, `0`, `1`) to reduce transcription errors on paper.

## Code generation

Implemented in [round-form.tsx](../../components/rounds/round-form.tsx) as `generateRoundSecretCode()`. Each judge, head judge, event logger, and timekeeper in a round gets a unique code at round creation time. See [round-configuration](round-configuration.md).

## Join flow

1. User opens `/<role>/events/[eventId]/join` (URL is shared by admin or printed on the code slip).
2. User enters the 6-character code via [`InputOTP`](https://github.com/guilhermerodz/input-otp).
3. Form validates that length === 6.
4. Form looks up the code → resolves to a destination URL.
5. `router.push(destination)` navigates to the role's workspace.

Currently the mock uses a small lookup `MOCK_CODE_DESTINATIONS` in [judge-join-form.tsx](../../components/judge/judge-join-form.tsx):

- `"111111"` → `/timekeeper/events/{eventId}` (demo timekeeper route)
- any other code → `/judge/events/{eventId}` (default for judge form)

In production this lookup happens server-side, validating the code against the round's assignments.

## Each role's join form

All four follow the same pattern with role-specific copy:

| Form | File |
|------|------|
| Judge | [judge-join-form.tsx](../../components/judge/judge-join-form.tsx) |
| Head Judge | [head-judge-join-form.tsx](../../components/judge/head-judge-join-form.tsx) |
| Event Logger | [event-logger-join-form.tsx](../../components/judge/event-logger-join-form.tsx) |
| Timekeeper | [timekeeper-join-form.tsx](../../components/timekeeper/timekeeper-join-form.tsx) |

## Pages that surface this feature

- [Judge join](../pages/judge/join.md)
- [Head judge join](../pages/head-judge/join.md)
- [Event logger join](../pages/event-logger/join.md)
- [Timekeeper join](../pages/timekeeper/join.md)
- [Admin moderator](../pages/admin/moderator.md) — issues and displays codes
- [Admin round form](../pages/admin/round-form.md) — generates codes

## TODOs before production

- Server-side code validation (currently client-side lookup only)
- Code expiry (codes should be valid only during the event window)
- Code revocation (admin can invalidate without regenerating)
- Rate limiting on the join endpoint
- Decide whether a single code is single-use or multi-use within the round

# Judge · Join

**Route**: `/judge/events/[eventId]/join`
**Role**: [judge](../../personas/judge.md)
**Type**: Server page wrapping a Client form
**Code**:
- [app/judge/events/[eventId]/join/page.tsx](../../../app/judge/events/[eventId]/join/page.tsx)
- [components/judge/judge-join-form.tsx](../../../components/judge/judge-join-form.tsx)

## Purpose

Take a 6-character secret code from a judge and route them to their workspace for this event.

## UI Sections

1. Brand / event header
2. Event info card (name, heat name, status label)
3. 6-character OTP input ([`InputOTP`](https://github.com/guilhermerodz/input-otp))
4. Submit button (disabled until length === 6)
5. Help text / link back

## Data Displayed

Source: `MOCK_EVENT_INFO[eventId]`. Sample: `evt-001` — "Racewalk Championship 2025".

## Actions

- Enter 6-char code → submit
- On submit: validate length, look up `MOCK_CODE_DESTINATIONS`, fallback `/judge/events/{eventId}`, `router.push()`
- Mock 400ms delay simulates network call
- Special demo code `"111111"` → routes to timekeeper instead

## Features Surfaced

- [secret-code-access](../../features/secret-code-access.md) (primary)

## TODOs

- Server-side code validation
- Error messaging when code is invalid
- Rate limiting

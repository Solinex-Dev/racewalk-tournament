# Public Viewer

**Auth**: None
**Routes**: `/`, `/events/[eventId]`
**Theme**: Dark

## What a public viewer does

Watches the live scoreboard. Can be a spectator at the venue, a relative following from home, or a federation official cross-referencing results.

No accounts, no codes. The URL is the access.

## Features used

| Feature | Notes |
|---------|-------|
| [live-scoreboard](../features/live-scoreboard.md) | Primary |

## Pages visited

- [Landing](../pages/public/landing.md)
- [Event live](../pages/public/event-live.md)

## Typical journey

1. Open the URL (received via social media, federation site, QR code at venue).
2. Land on `/` or directly on `/events/[eventId]`.
3. Watch positions, lap counts, and card totals update.
4. After the event, the same URL serves as the result archive.

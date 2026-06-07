# Public · Landing

**Route**: `/`
**Role**: [public-viewer](../../personas/public-viewer.md) (no auth)
**Type**: Server Component
**Code**: [app/page.tsx](../../../app/page.tsx)

**Status**: Implemented

## Purpose

The entry point for spectators. Lists every non-draft event's rounds — grouped by event and bucketed into Live / Upcoming / Recent — so a viewer can jump straight into the live scoreboard for any round (multiple simultaneous rounds supported).

## UI Sections

1. **Top nav** — brand/logo + a "เข้าสู่ระบบผู้จัดงาน" (organizer login) link → `/admin/login`
2. **Hero block** — brand, headline, and a live indicator showing how many rounds are currently racing
3. **กำลังแข่งขันสด (Live now)** — `ONGOING` rounds, each card showing the current leader, lap progress bar, and card/DQ stat chips
4. **รอบที่กำลังจะมาถึง (Upcoming)** — `SCHEDULED` rounds with their scheduled start time
5. **ผลการแข่งขันล่าสุด (Recent results)** — up to 9 `FINISHED` rounds, each card showing the top-3 podium
6. **About accordion** — [`AboutAccordion`](../../../components/common/about-accordion.tsx), static racewalk info

Each round card is a link to `/events/[eventId]?round=[roundId]` — that is how viewers reach a specific round on the [live scoreboard](event-live.md).

## Data Displayed

Real data. A Prisma query in the Server Component (`app/page.tsx`) loads all `deletedAt: null` events with `status != DRAFT`, including their rounds, round-athletes, finish/lap times, and confirmed cards. Each round is reduced to a view-model (status, distance in metres, lap progress, finished/yellow/red/DQ counts, plus a podium for finished rounds or a current leader for live rounds) and grouped by event. BIB is event-scoped (`EventAthlete.bib`); red/yellow counts use the same confirmed-card filter as the scoreboard.

## Actions

Navigation only — clicking a round card opens its live scoreboard; the nav link opens admin login.

## Features Surfaced

- [live-scoreboard](../../features/live-scoreboard.md) (entry point)

## State / Behavior

- **`dynamic = "force-dynamic"`, `revalidate = 0`** — rendered at request time so newly-started / finished rounds appear.
- **Soft real-time.** [`AutoRefresh`](../../../components/common/auto-refresh.tsx) calls `router.refresh()` every **15s** to re-pull the round buckets; live round cards embed [`LiveTimer`](../../../components/common/live-timer.tsx) for a ticking clock between refreshes.

## Open Issues / TODOs

- Language toggle visible from landing

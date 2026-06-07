# Product Overview

## What this is

A web application for running and judging **racewalk** competitions — recording infractions (yellow/red cards), tracking lap times, displaying a live scoreboard, and producing official results.

Racewalk has strict technique rules. Judges issue cards in real time when an athlete's technique violates the rules. The system replaces paper-based card collection and manual scoreboards with a coordinated digital workflow.

## The problem it solves

In a typical racewalk competition:

- Multiple judges stand around the course, each watching a sector.
- When an athlete commits a fault, the judge issues a card.
- Cards from all judges must be aggregated against per-athlete limits — and the **4th confirmed red card disqualifies** the athlete.
- The audience and officials need a live scoreboard.
- Results must be exportable for official records.

Coordinating this on paper is slow and error-prone. This system gives each role (judge, head judge, event logger, timekeeper, admin, public viewer) a dedicated interface, with the card aggregation and disqualification logic centralized.

## Who uses it

Six roles, each with a distinct view of the same event. See [personas/](../personas/) for details.

| Role | Primary task |
|------|--------------|
| **Admin** | Configure events, rounds, athletes, judges; generate access codes |
| **Head Judge** | Oversee judging, confirm/override red cards |
| **Judge** | Issue yellow and red cards from the side of the course |
| **Event Logger** | Record lap times and finish times manually |
| **Timekeeper** | Record laps with a stopwatch interface |
| **Public Viewer** | Watch the live scoreboard |

## How users access the system

- **Admin** logs in with email + password (NextAuth credentials, bcrypt-hashed; optional Google OAuth). Sessions are JWT-based and tracked in a `UserSession` table for revocation. See [auth.ts](../../auth.ts).
- **All non-admin race-day roles** join an event by entering a 6-character **secret code** that the Admin generated for them per round. A successful join issues a signed (jose HS256) `rw_official_session` cookie — no accounts to manage, no passwords to remember. Join handler: [app/actions/officials.ts](../../app/actions/officials.ts) (`joinAsOfficial`); cookie: [lib/official-jwt.ts](../../lib/official-jwt.ts).
- **Public viewers** open the live scoreboard URL directly — no auth.

See [features/secret-code-access.md](../features/secret-code-access.md).

## Current state

**Status: Implemented.** The application runs on a real **Prisma 7 + MySQL/MariaDB** backend (Next.js 16 App Router, React 19).

- **Reads** are Prisma queries in Server Components.
- **Writes** are Server Actions in `app/actions/*` (e.g. [app/actions/cards.ts](../../app/actions/cards.ts), [app/actions/timing.ts](../../app/actions/timing.ts)), which persist via Prisma and then invalidate caches with `revalidatePath` / `revalidateTag` (see [lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)).
- **Live updates** for officials use `router.refresh()` polling ([components/common/auto-refresh.tsx](../../components/common/auto-refresh.tsx), 2000ms while a round is `SCHEDULED`, 2500ms otherwise). The **public scoreboard** instead client-polls a CDN-cached JSON endpoint every 5s ([app/api/events/[eventId]/leaderboard/route.ts](../../app/api/events/[eventId]/leaderboard/route.ts), built by [lib/leaderboard.ts](../../lib/leaderboard.ts)).

See [architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md) for the read/write/real-time data flow.

## Related docs

- [domain-rules.md](domain-rules.md) — the racewalk rules encoded in this system
- [glossary.md](glossary.md) — terminology used throughout the docs
- [features/README.md](../features/README.md) — feature index

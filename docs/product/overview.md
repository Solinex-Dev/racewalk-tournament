# Product Overview

## What this is

A web application for running and judging **racewalk** competitions — recording infractions (yellow/red cards), tracking lap times, displaying a live scoreboard, and producing official results.

Racewalk has strict technique rules. Judges issue cards in real time when an athlete's technique violates the rules. The system replaces paper-based card collection and manual scoreboards with a coordinated digital workflow.

## The problem it solves

In a typical racewalk competition:

- Multiple judges stand around the course, each watching a sector.
- When an athlete commits a fault, the judge issues a card.
- Cards from all judges must be aggregated against per-athlete limits — and the **4th red card disqualifies** the athlete.
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

- **Admin** logs in with username + password.
- **All non-admin roles** join an event by entering a 6-character **secret code** that the Admin generated for them per round. No accounts to manage, no passwords to remember.
- **Public viewers** open the live scoreboard URL directly — no auth.

See [features/secret-code-access.md](../features/secret-code-access.md).

## Current state

The application is a **UI prototype**. All data is mocked via `MOCK_*` constants in page and component files. The planned backend is **Prisma + MySQL**.

See [architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md) for the mock-to-real migration plan.

## Related docs

- [domain-rules.md](domain-rules.md) — the racewalk rules encoded in this system
- [glossary.md](glossary.md) — terminology used throughout the docs
- [features/README.md](../features/README.md) — feature index

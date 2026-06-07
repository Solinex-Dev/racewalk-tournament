# Features

This index lists every capability of the system. Each feature has its own doc describing what it does, who uses it, where it lives in the code, and which pages surface it.

## Feature index

| Feature | Status | Primary roles | Touches |
|---------|--------|---------------|---------|
| [event-management](event-management.md) | Implemented | Admin | Events |
| [round-configuration](round-configuration.md) | Implemented | Admin | Rounds, Judges, Athletes |
| [secret-code-access](secret-code-access.md) | Implemented | All non-admin | Official sessions |
| [card-scoring](card-scoring.md) | Implemented | Judge, Head Judge | Cards, Athletes |
| [event-logging](event-logging.md) | Implemented | Event Logger | Lap times, Finish times, Activity log |
| [timekeeping](timekeeping.md) | Implemented (merged into Event Logger) | Event Logger | Lap times |
| [live-scoreboard](live-scoreboard.md) | Implemented | Public Viewer | All event data (read-only) |
| [reporting-export](reporting-export.md) | Implemented | Admin | Event results |
| [athlete-affiliation-mgmt](athlete-affiliation-mgmt.md) | Implemented | Admin | Athletes, Affiliations |
| [judge-mgmt](judge-mgmt.md) | Implemented | Admin | Judges |
| [admin-mgmt](admin-mgmt.md) | Implemented | Admin (owner) | Admins |

## Feature × Page matrix

Which page surfaces which feature. A page may surface multiple features.

| Feature ↓ / Page → | Public scoreboard | Judge workspace | Head judge | Event logger | Timekeeper | Admin moderator | Admin events | Admin judges | Admin athletes | Admin affiliations | Admin admins |
|---|---|---|---|---|---|---|---|---|---|---|---|
| event-management | | | | | | ● | ● | | | | |
| round-configuration | | | | | | ● | | | | | |
| secret-code-access | | ●(join) | ●(join) | ●(join) | ●(join) | ● (issuer) | | | | | |
| card-scoring | view | ● | ● | | | view | | | | | |
| event-logging | view | | | ● | | view | | | | | |
| timekeeping | view | | | | ● | view | | | | | |
| live-scoreboard | ● | | | | | | | | | | |
| reporting-export | | | | | | ● | ● | | | | |
| athlete-affiliation-mgmt | | | | | | | | | ● | ● | |
| judge-mgmt | | | | | | | | ● | | | |
| admin-mgmt | | | | | | | | | | | ● |

**●** = primary implementation surface · **view** = read-only/derived view

> Note: the **Timekeeper** column above is legacy. Lap/finish recording is now served by the **Event Logger** workspace (`/event-logger/events/[eventId]`), authenticated with the `EVENT_LOGGER` official position. There is no separate `/timekeeper` route in the current code; the shared recorder component is [`lap-recorder.tsx`](../../components/timekeeper/lap-recorder.tsx). See [timekeeping](timekeeping.md).

## Feature × Role matrix

Which features each role uses. See [personas/](../personas/) for per-role detail.

| Feature ↓ / Role → | Admin | Head Judge | Judge | Event Logger | Timekeeper | Public Viewer |
|---|---|---|---|---|---|---|
| event-management | ● | | | | | |
| round-configuration | ● | | | | | |
| secret-code-access | issues | uses | uses | uses | uses | |
| card-scoring | oversee | confirm/override | issue | | | view |
| event-logging | view | view | | record | | view |
| timekeeping | view | view | | | record | view |
| live-scoreboard | view | view | view | view | view | ● |
| reporting-export | ● | | | | | |
| athlete-affiliation-mgmt | ● | | | | | |
| judge-mgmt | ● | | | | | |
| admin-mgmt | ● (owner) | | | | | |

## Reading a feature doc

Every feature doc opens with a header in this shape:

```
Status: <implementation status>
Roles: <which personas>
Routes: <pages that surface it>
Entities: <Prisma models touched>
Related features: <links>
Decisions: <ADR links>
```

This makes each feature doc a hub — you can jump from it to the pages, the personas, the data model, and the design rationale.

## Implementation note

The app is fully implemented on a Prisma backend (MySQL/MariaDB via `@prisma/adapter-mariadb`). Reads are direct Prisma queries in Server Components; writes are Server Actions in `app/actions/*` that mutate via Prisma and then invalidate caches through `lib/revalidate-race-day.ts` (`revalidatePath` for each race-day view + `revalidateTag` for the public leaderboard). Admins authenticate with NextAuth (JWT + a `UserSession` row); race-day officials (judge / head judge / event logger) authenticate with a signed `jose` JWT cookie issued after a 6-character secret-code join. See [secret-code-access](secret-code-access.md) and the data model in [../architecture/data-model.md](../architecture/data-model.md).

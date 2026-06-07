# Admin

**Auth**: Email + password (NextAuth JWT session; OAuth Google optional) — see [auth.ts](../../auth.ts)
**Route prefix**: `/admin/...` (gated by [proxy.ts](../../proxy.ts), requires `role === "ADMIN"`)
**Theme**: Light (slate-50 background, sidebar layout)
**Permissions**: Root admins (`isRoot`) bypass all checks; everyone else is gated by a per-resource permission matrix — see [features/admin-mgmt](../features/admin-mgmt.md) and [lib/permissions.ts](../../lib/permissions.ts)

## What an admin does

- Sets up everything **before** the race
- Monitors and moderates **during** the race
- Exports official results **after** the race

## Permission model

Authorization is enforced server-side on every mutating Server Action via `requirePermission(resource, action)` ([lib/authz.ts](../../lib/authz.ts)). Resources are `events`, `moderator`, `athletes`, `judges`, `affiliations`, `admins`, `reports`; actions are `view`, `create`, `edit`, `delete` (`moderator` and `reports` are view-only). `getCurrentAdmin()` re-reads the user from the DB on every call, so permission changes take effect immediately (no stale JWT). Root admins skip the matrix entirely.

## Features used

| Feature | Phase | Notes |
|---------|-------|-------|
| [admin-mgmt](../features/admin-mgmt.md) | setup | Root admins; system keeps ≥1 root |
| [judge-mgmt](../features/judge-mgmt.md) | setup | Maintain officials + Organization/Department hierarchy |
| [athlete-affiliation-mgmt](../features/athlete-affiliation-mgmt.md) | setup | Maintain athletes and affiliations/clubs |
| [event-management](../features/event-management.md) | setup | Create events, register athletes + BIBs |
| [round-configuration](../features/round-configuration.md) | setup | Configure each round, assign athletes/officials |
| [secret-code-access](../features/secret-code-access.md) | setup | Generate codes for officials |
| [card-scoring](../features/card-scoring.md) | live | Oversee + correct (delete/confirm/override) via moderator |
| [event-logging](../features/event-logging.md) | live | Start/stop rounds, watch activity log |
| [reporting-export](../features/reporting-export.md) | after | Export official results |

## Pages visited

- [Login](../pages/admin/login.md)
- [Dashboard](../pages/admin/dashboard.md)
- [Events list](../pages/admin/events-list.md), [Event detail](../pages/admin/event-detail.md)
- [Round form](../pages/admin/round-form.md)
- [Moderator](../pages/admin/moderator.md) (the live control room) and [edit](../pages/admin/moderator-edit.md)
- [Event report](../pages/admin/event-report.md)
- [Judges](../pages/admin/judges.md), [Athletes](../pages/admin/athletes.md), [Affiliations](../pages/admin/affiliations.md), [Admins](../pages/admin/admins.md)
- [Settings](../pages/admin/settings.md)

## How writes work

Admin pages are Server Components that read Prisma directly. Mutations are Server Actions in [app/actions/](../../app/actions/) (e.g. `app/actions/events.ts`, `app/actions/rounds.ts`, `app/actions/moderator.ts`, `app/actions/round-timing.ts`). Each action checks permission, writes via Prisma, logs an admin `ActivityLog` (`logCurrentAdmin`), and invalidates the affected views — race-day writes call `revalidateRaceDayViews(eventId)` ([lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)), which `revalidatePath`s the workspaces + moderator + public board and `revalidateTag`s the cached leaderboard.

## Typical workflow

1. Create athletes and affiliations once per season (CSV bulk import is available to root admins).
2. Create an event; register athletes with BIBs; configure rounds; assign athletes and officials.
3. Generate the 6-char secret codes (auto-filled per official); print and hand out at venue.
4. During the race: start the round (requires ≥1 head judge, ≥1 judge, ≥1 event logger), keep [moderator](../pages/admin/moderator.md) open, and confirm/override/correct cards as needed.
5. After the race: export the report.

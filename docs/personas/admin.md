# Admin

**Auth**: Username + password
**Route prefix**: `/admin/...`
**Theme**: Light (slate-50 background, sidebar layout)
**Sub-roles** (planned): `owner`, `event manager`, `score officer` — see [features/admin-mgmt](../features/admin-mgmt.md)

## What an admin does

- Sets up everything **before** the race
- Monitors and moderates **during** the race
- Exports official results **after** the race

## Features used

| Feature | Phase | Notes |
|---------|-------|-------|
| [admin-mgmt](../features/admin-mgmt.md) | setup | Owner only |
| [judge-mgmt](../features/judge-mgmt.md) | setup | Maintain the pool of officials |
| [athlete-affiliation-mgmt](../features/athlete-affiliation-mgmt.md) | setup | Maintain athletes and clubs |
| [event-management](../features/event-management.md) | setup | Create events |
| [round-configuration](../features/round-configuration.md) | setup | Configure each round, assign athletes/officials |
| [secret-code-access](../features/secret-code-access.md) | setup | Issue codes to officials |
| [card-scoring](../features/card-scoring.md) | live | Oversee (no card-issuing) |
| [event-logging](../features/event-logging.md) | live | View activity log |
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

## Typical workflow

1. Create athletes and affiliations once per season.
2. Create an event; configure rounds; assign athletes and judges.
3. Generate secret codes; print and hand out at venue.
4. During the race: keep [moderator](../pages/admin/moderator.md) open. Confirm/override red cards as needed.
5. After the race: export the report.

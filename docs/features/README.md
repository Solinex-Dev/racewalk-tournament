# Features

This index lists every capability of the system. Each feature has its own doc describing what it does, who uses it, where it lives in the code, and which pages surface it.

## Feature index

| Feature | Status | Primary roles | Touches |
|---------|--------|---------------|---------|
| [event-management](event-management.md) | UI only | Admin | Events |
| [round-configuration](round-configuration.md) | UI only | Admin | Rounds, Judges, Athletes |
| [secret-code-access](secret-code-access.md) | UI only | All non-admin | Sessions |
| [card-scoring](card-scoring.md) | UI only | Judge, Head Judge | Cards, Athletes |
| [event-logging](event-logging.md) | UI only | Event Logger | Lap times, Activity log |
| [timekeeping](timekeeping.md) | UI only | Timekeeper | Lap times |
| [live-scoreboard](live-scoreboard.md) | UI only | Public Viewer | All event data (read-only) |
| [reporting-export](reporting-export.md) | UI only | Admin | Event results |
| [athlete-affiliation-mgmt](athlete-affiliation-mgmt.md) | UI only | Admin | Athletes, Affiliations |
| [judge-mgmt](judge-mgmt.md) | UI only | Admin | Judges |
| [admin-mgmt](admin-mgmt.md) | UI only | Admin (owner) | Admins |

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
Entities: <data model types touched>
Related features: <links>
Decisions: <ADR links>
```

This makes each feature doc a hub — you can jump from it to the pages, the personas, the data model, and the design rationale.

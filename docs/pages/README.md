# Pages

This is the page catalogue and sitemap. One doc per page (route). Each page doc describes its purpose, UI sections, data displayed, actions, and which features it surfaces.

## Sitemap

```
/                                       Landing page
/events/[eventId]                       Public live scoreboard

/admin/login                            Admin login
/admin                                  Admin dashboard
/admin/admins                           Admin list
/admin/admins/new                       Create admin
/admin/admins/[adminId]                 Edit admin
/admin/events                           Event list
/admin/events/new                       Create event
/admin/events/[eventId]                 Edit event
/admin/events/[eventId]/report          Event report / export
/admin/events/[eventId]/moderator       Event moderator (live oversight)
/admin/events/[eventId]/moderator/edit  Moderator config edit
/admin/events/[eventId]/rounds/new      Create round
/admin/events/[eventId]/rounds/[roundId] Edit round
/admin/judges                           Judge list
/admin/judges/new                       Create judge
/admin/judges/[judgeId]                 Edit judge
/admin/athletes                         Athlete list
/admin/athletes/new                     Create athlete
/admin/athletes/[athleteId]             Edit athlete
/admin/affiliations                     Affiliation list
/admin/affiliations/new                 Create affiliation
/admin/affiliations/[affiliationId]     Edit affiliation
/admin/settings                         Settings

/judge/events/[eventId]/join            Judge join (secret code)
/judge/events/[eventId]                 Judge workspace

/head-judge/events/[eventId]/join       Head judge join
/head-judge/events/[eventId]            Head judge workspace

/event-logger/events/[eventId]/join     Event logger join
/event-logger/events/[eventId]          Event logger workspace

/timekeeper/events/[eventId]/join       Timekeeper join
/timekeeper/events/[eventId]            Timekeeper workspace
```

## Page index by role

### Public

| Page | Route | Doc |
|------|-------|-----|
| Landing | `/` | [public/landing.md](public/landing.md) |
| Event live scoreboard | `/events/[eventId]` | [public/event-live.md](public/event-live.md) |

### Admin

| Page | Route | Doc |
|------|-------|-----|
| Login | `/admin/login` | [admin/login.md](admin/login.md) |
| Dashboard | `/admin` | [admin/dashboard.md](admin/dashboard.md) |
| Events list | `/admin/events` | [admin/events-list.md](admin/events-list.md) |
| Event detail (edit) | `/admin/events/[eventId]` | [admin/event-detail.md](admin/event-detail.md) |
| Event report | `/admin/events/[eventId]/report` | [admin/event-report.md](admin/event-report.md) |
| Event moderator | `/admin/events/[eventId]/moderator` | [admin/moderator.md](admin/moderator.md) |
| Moderator edit | `/admin/events/[eventId]/moderator/edit` | [admin/moderator-edit.md](admin/moderator-edit.md) |
| Round form | `/admin/events/[eventId]/rounds/...` | [admin/round-form.md](admin/round-form.md) |
| Judges (list / new / edit) | `/admin/judges/...` | [admin/judges.md](admin/judges.md) |
| Athletes (list / new / edit) | `/admin/athletes/...` | [admin/athletes.md](admin/athletes.md) |
| Affiliations (list / new / edit) | `/admin/affiliations/...` | [admin/affiliations.md](admin/affiliations.md) |
| Admins (list / new / edit) | `/admin/admins/...` | [admin/admins.md](admin/admins.md) |
| Settings | `/admin/settings` | [admin/settings.md](admin/settings.md) |

### Judge

| Page | Route | Doc |
|------|-------|-----|
| Join | `/judge/events/[eventId]/join` | [judge/join.md](judge/join.md) |
| Workspace | `/judge/events/[eventId]` | [judge/workspace.md](judge/workspace.md) |

### Head Judge

| Page | Route | Doc |
|------|-------|-----|
| Join | `/head-judge/events/[eventId]/join` | [head-judge/join.md](head-judge/join.md) |
| Workspace | `/head-judge/events/[eventId]` | [head-judge/workspace.md](head-judge/workspace.md) |

### Event Logger

| Page | Route | Doc |
|------|-------|-----|
| Join | `/event-logger/events/[eventId]/join` | [event-logger/join.md](event-logger/join.md) |
| Workspace | `/event-logger/events/[eventId]` | [event-logger/workspace.md](event-logger/workspace.md) |

### Timekeeper

| Page | Route | Doc |
|------|-------|-----|
| Join | `/timekeeper/events/[eventId]/join` | [timekeeper/join.md](timekeeper/join.md) |
| Workspace | `/timekeeper/events/[eventId]` | [timekeeper/workspace.md](timekeeper/workspace.md) |

## Route conventions

- The **admin auth pages** sit inside route group `(auth)` — they bypass the dashboard layout.
- The **admin dashboard pages** sit inside route group `(pages)` — they share `DashboardSidebar` via the group's `layout.tsx`.
- The **dynamic segment `[eventId]`** appears in every non-admin role's route tree. The role lives in the route prefix; the event is the resource.
- Dynamic `params` in Next.js 16 is a `Promise<{...}>` — unwrap with `await props.params` (server) or `use(props.params)` (client).

See [architecture/overview.md](../architecture/overview.md) for the rationale behind the role-prefix routing.

## Page doc template

Every page doc has this shape:

```markdown
# <Role> · <Page Name>

**Route**: <path>
**Role**: [<role>]
**Type**: Server / Client
**Code**: <file path>

## Purpose
What this page is for.

## UI Sections
The visible blocks of the page.

## Data Displayed
What data appears (mock constant names).

## Actions
What the user can do here.

## Features Surfaced
Links to features/*.md.

## State / Behavior
Local state, special interactions.

## Open Issues / TODOs
Known gaps before this page is production-ready.
```

# Personas

A persona is a role-shaped view of the system: what one type of user cares about, the features they use, the pages they visit.

Personas are intentionally **thin** — they reference features and pages rather than re-explaining them. The substance lives in [features/](../features/) and [pages/](../pages/).

## Persona index

| Persona | Auth method | Doc |
|---------|-------------|-----|
| [Admin](admin.md) | Username + password | Configures everything |
| [Head Judge](head-judge.md) | 6-char secret code | Oversees judging panel |
| [Judge](judge.md) | 6-char secret code | Issues cards |
| [Event Logger](event-logger.md) | 6-char secret code | Manually records lap times |
| [Timekeeper](timekeeper.md) | 6-char secret code | Records laps with stopwatch |
| [Public Viewer](public-viewer.md) | None | Watches live scoreboard |

## Role × Feature matrix

| Feature ↓ / Role → | Admin | Head Judge | Judge | Event Logger | Timekeeper | Public Viewer |
|---|---|---|---|---|---|---|
| [event-management](../features/event-management.md) | ● | | | | | |
| [round-configuration](../features/round-configuration.md) | ● | | | | | |
| [secret-code-access](../features/secret-code-access.md) | issues | uses | uses | uses | uses | |
| [card-scoring](../features/card-scoring.md) | oversee | confirm/override | issue | | | view |
| [event-logging](../features/event-logging.md) | view | view | | record | | view |
| [timekeeping](../features/timekeeping.md) | view | view | | | record | view |
| [live-scoreboard](../features/live-scoreboard.md) | view | view | view | view | view | ● |
| [reporting-export](../features/reporting-export.md) | ● | | | | | |
| [athlete-affiliation-mgmt](../features/athlete-affiliation-mgmt.md) | ● | | | | | |
| [judge-mgmt](../features/judge-mgmt.md) | ● | | | | | |
| [admin-mgmt](../features/admin-mgmt.md) | ● (owner) | | | | | |

## Role × Route prefix

| Role | Route prefix | Theme | Doc |
|------|--------------|-------|-----|
| Admin | `/admin/...` | Light (slate-50, sidebar layout) | [admin.md](admin.md) |
| Head Judge | `/head-judge/events/[eventId]/...` | Dark | [head-judge.md](head-judge.md) |
| Judge | `/judge/events/[eventId]/...` | Dark | [judge.md](judge.md) |
| Event Logger | `/event-logger/events/[eventId]/...` | Dark | [event-logger.md](event-logger.md) |
| Timekeeper | `/timekeeper/events/[eventId]/...` | Dark | [timekeeper.md](timekeeper.md) |
| Public Viewer | `/events/[eventId]`, `/` | Dark | [public-viewer.md](public-viewer.md) |

## Why role-prefix routing

Each role has its own dedicated route tree (`/judge/...`, `/head-judge/...`, etc.) rather than a single `/event/[eventId]?role=judge` setup. Reasons:

- **Independent layouts** — admin uses a sidebar; in-event roles use a focused dark UI without chrome.
- **Independent auth surface** — admin uses passwords; everyone else uses secret codes; public uses none.
- **Clear deep-link semantics** — the URL alone tells you which role's view you're seeing.

See [architecture/overview.md](../architecture/overview.md) for more.

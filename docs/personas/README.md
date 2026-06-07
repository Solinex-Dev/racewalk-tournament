# Personas

A persona is a role-shaped view of the system: what one type of user cares about, the features they use, the pages they visit.

Personas are intentionally **thin** — they reference features and pages rather than re-explaining them. The substance lives in [features/](../features/) and [pages/](../pages/).

**Status**: Implemented. Every role below is wired to the real Prisma backend — admin reads/writes through Server Components and Server Actions in [app/actions/](../../app/actions/); race-day roles authenticate via a signed JWT cookie issued after a 6-character secret-code join; the public viewer polls a CDN-cached JSON endpoint.

## Persona index

| Persona | Auth method | Doc |
|---------|-------------|-----|
| [Admin](admin.md) | Email + password (NextAuth JWT) | Configures everything |
| [Head Judge](head-judge.md) | 6-char secret code → official cookie | Oversees judging panel |
| [Judge](judge.md) | 6-char secret code → official cookie | Issues cards |
| [Event Logger](event-logger.md) | 6-char secret code → official cookie | Records lap / finish times |
| [Timekeeper](timekeeper.md) | (folded into Event Logger) | Fast-tap lap recording surface |
| [Public Viewer](public-viewer.md) | None | Watches live scoreboard |

> **Note on Timekeeper**: there is no standalone `/timekeeper/...` route or `TIMEKEEPER` position in the current build. The fast click-driven lap-recording surface (`components/timekeeper/lap-recorder.tsx`) is shared by — and now lives inside — the **Event Logger** workspace; timing Server Actions require the `EVENT_LOGGER` official position. See [timekeeper.md](timekeeper.md).

## Role × Feature matrix

| Feature ↓ / Role → | Admin | Head Judge | Judge | Event Logger | Timekeeper | Public Viewer |
|---|---|---|---|---|---|---|
| [event-management](../features/event-management.md) | ● | | | | | |
| [round-configuration](../features/round-configuration.md) | ● | | | | | |
| [secret-code-access](../features/secret-code-access.md) | issues | uses | uses | uses | (via logger) | |
| [card-scoring](../features/card-scoring.md) | oversee/correct | confirm/override | issue | | | view |
| [event-logging](../features/event-logging.md) | view | view | | record | (via logger) | view |
| [timekeeping](../features/timekeeping.md) | view | view | | record | record | view |
| [live-scoreboard](../features/live-scoreboard.md) | view | view | view | view | view | ● |
| [reporting-export](../features/reporting-export.md) | ● | | | | | |
| [athlete-affiliation-mgmt](../features/athlete-affiliation-mgmt.md) | ● | | | | | |
| [judge-mgmt](../features/judge-mgmt.md) | ● | | | | | |
| [admin-mgmt](../features/admin-mgmt.md) | ● (root) | | | | | |

## Role × Route prefix

| Role | Route prefix | Theme | Doc |
|------|--------------|-------|-----|
| Admin | `/admin/...` | Light (slate-50, sidebar layout) | [admin.md](admin.md) |
| Head Judge | `/head-judge/events/[eventId]/...` | Dark | [head-judge.md](head-judge.md) |
| Judge | `/judge/events/[eventId]/...` | Dark | [judge.md](judge.md) |
| Event Logger | `/event-logger/events/[eventId]/...` | Dark | [event-logger.md](event-logger.md) |
| Timekeeper | (no separate route — see Event Logger) | Dark | [timekeeper.md](timekeeper.md) |
| Public Viewer | `/events/[eventId]`, `/` | Dark | [public-viewer.md](public-viewer.md) |

Route protection: the Next.js middleware [proxy.ts](../../proxy.ts) gates `/admin/*` (NextAuth JWT, `role === "ADMIN"`) and slides the official-session cookie for `/judge`, `/head-judge`, `/event-logger`. Public routes (`/`, `/events/*`) deliberately skip middleware so spectator traffic pays no token verification.

## Why role-prefix routing

Each role has its own dedicated route tree (`/judge/...`, `/head-judge/...`, etc.) rather than a single `/event/[eventId]?role=judge` setup. Reasons:

- **Independent layouts** — admin uses a sidebar; in-event roles use a focused dark UI without chrome.
- **Independent auth surface** — admin uses NextAuth email/password; race-day officials use secret codes (a signed `rw_official_session` cookie); public uses none.
- **Clear deep-link semantics** — the URL alone tells you which role's view you're seeing.

See [architecture/overview.md](../architecture/overview.md) for more.

# Architecture Overview

High-level shape of the system. For the underlying tech versions, see [tech-stack.md](tech-stack.md).

## System context

```
            ┌──────────────────────────────────────────┐
            │              Browsers                    │
            │  Admin · Head Judge · Judge · Logger ·   │
            │  Timekeeper · Public Viewer              │
            └─────────────┬────────────────────────────┘
                          │ HTTPS
                          ▼
            ┌──────────────────────────────────────────┐
            │         Next.js App (App Router)          │
            │  • Role-prefixed route trees              │
            │  • Server Components for pages            │
            │  • Client Components for interactivity    │
            │  • Route handlers (API)  ── planned       │
            └─────────────┬────────────────────────────┘
                          │ Prisma  ── planned
                          ▼
            ┌──────────────────────────────────────────┐
            │              MySQL                       │
            │  Events · Rounds · Athletes · Judges ·   │
            │  Cards · Lap times · Activity log        │
            └──────────────────────────────────────────┘
```

Today everything above the Prisma line is implemented as a UI prototype with `MOCK_*` constants. The dashed boundary is the planned backend.

## Routing model: role prefix + event resource

```
/<role>/events/[eventId]/<page>
```

- The **role prefix** (`/admin`, `/judge`, `/head-judge`, `/event-logger`, `/timekeeper`) selects the role's view.
- The **event id** selects the resource.
- Public routes use `/events/[eventId]` (no role prefix).

### Why role-prefix routing

| Alternative | Problem |
|-------------|---------|
| Single `/event/[id]?role=X` | URL hides which view you're on; harder to bookmark/share role-specific screens |
| Single `/event/[id]` with internal role-switch | One layout has to satisfy all roles; conflicting chrome and theme |
| Role on subdomain | Operational overhead, certs, no benefit |

Role-prefix routing keeps each tree's layout and auth surface independent. It also makes the URL self-describing.

## Auth model

Two auth surfaces:

1. **Admin** — username + password → session. Single sign-in for all admin pages. Route group `(auth)` separates the login page from the dashboard layout.
2. **In-event roles** — 6-character secret code per round. Codes are role-scoped and round-scoped; no account, no persistent identity. See [features/secret-code-access](../features/secret-code-access.md).
3. **Public** — no auth. URL is the access.

## Layout strategy

- `app/layout.tsx` — root layout: html lang, Geist fonts, metadata.
- `app/admin/(pages)/layout.tsx` — admin shared layout with `DashboardSidebar`. Light theme.
- `app/admin/(auth)/login/layout.tsx` — auth layout without the sidebar.
- In-event role pages each have their own dark-themed layout.
- Public pages share the dark theme.

## Client vs. server components

- Most page-level components are **Server Components** by default.
- Components that need interaction (forms, workspace state, timers) are marked `"use client"`.
- The convention used in this project: pages stay server, and they wrap a `<ClientComponent />` for the interactive part. Examples:
  - `JudgeJoinForm` (client) inside server page
  - `JudgeWorkspace` (client) inside server page
  - `EventForm`, `AthleteForm`, `RoundForm`, etc. — all client, used by server pages

## State management

- **No global store** — no Redux, Zustand, or Context for state.
- All interactive state is `useState` at the component level.
- This will need to evolve once cards must sync across judges in real time. See [state-and-data-flow.md](state-and-data-flow.md).

## Data flow today vs. tomorrow

| Concern | Today | Planned |
|---------|-------|---------|
| Read data | Inline `MOCK_*` constants | Prisma queries via server components / route handlers |
| Write data | `console.log` + `alert("mock")` | Server actions or route handlers |
| Sync between users | None | WebSocket or polling — TBD |
| Persistence | None | MySQL |

## Related docs

- [tech-stack.md](tech-stack.md) — versions and libraries
- [data-model.md](data-model.md) — entity relationships, planned schema
- [state-and-data-flow.md](state-and-data-flow.md) — mock-to-real migration plan
- [../pages/README.md](../pages/README.md) — full route tree

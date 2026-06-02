# Getting Started

How to run the project locally.

## Prerequisites

- **Node.js** — version that supports Next.js 16. (Project does not pin a specific version; use the latest LTS.)
- **npm** — comes with Node.

No database is required today — all data is mocked.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

## What to open

| URL | What you'll see |
|-----|-----------------|
| `http://localhost:3000/` | Landing page |
| `http://localhost:3000/events/evt-001` | Live scoreboard for sample event 1 |
| `http://localhost:3000/admin/login` | Admin login (any credentials, mock validates) |
| `http://localhost:3000/admin` | Admin dashboard (post-login) |
| `http://localhost:3000/judge/events/evt-001/join` | Judge join — enter any 6-char code |
| `http://localhost:3000/timekeeper/events/evt-001/join` | Timekeeper join — code `111111` is a known demo code |
| `http://localhost:3000/head-judge/events/evt-001/join` | Head judge join |
| `http://localhost:3000/event-logger/events/evt-001/join` | Event logger join |

See [../pages/README.md](../pages/README.md) for the full sitemap.

## Useful commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

No test runner is configured.

## Editing flow

- Edit a page or component file → the dev server hot-reloads.
- Mocks live inline in page files — see the `MOCK_*` constants. Edit them to change displayed data on the fly.
- Form submits log to the browser console and show an `alert("... (mock)")`.

## Project structure

```
app/                  Next.js routes (App Router)
components/           Components, organized by domain
  ui/                 shadcn primitives
  partials/           Larger shared blocks (sidebar)
  <entity>/           Per-entity CRUD components
  judge/              Judge-side workspace + join forms (also head judge, event logger)
  timekeeper/         Timekeeper-specific components
hooks/                React hooks (use-mobile)
lib/                  Utilities (cn)
public/               Static assets
docs/                 This documentation
```

## Common gotchas

- **`params` is a Promise** — Next.js 16 requires `await props.params` (server) or `use(props.params)` (client). See [../conventions/code-style.md](../conventions/code-style.md).
- **Theme is fixed per route prefix** — no toggle. Admin/public is light; in-event roles are dark. See [../architecture/overview.md](../architecture/overview.md).
- **No global state library** — all interaction is `useState`. If you reach for Context, pause and ask whether props will do.
- **Codes are 6 chars** — `MOCK_CODE_DESTINATIONS` only routes `"111111"` specially; everything else falls back to the role's default workspace.

## When you're stuck

- Search the codebase for a `MOCK_*` constant — it points to where data is produced.
- Search for `TODO` — that's where real API calls go.
- Read the relevant feature doc under [../features/](../features/) before editing.

## Deployment

Not yet documented. Plan is to deploy the Next.js app behind any standard Node host with MySQL adjacent. See [../architecture/state-and-data-flow.md](../architecture/state-and-data-flow.md) for the backend migration plan.

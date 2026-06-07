# Tech Stack

Versions are the semver ranges in [package.json](../../package.json) (app `version: 1.1.0`).

## Frameworks and runtime

| Concern | Choice | Version |
|---------|--------|---------|
| Framework | Next.js (App Router) | ^16.0.7 |
| UI runtime | React | 19.2.0 |
| Language | TypeScript (strict) | ^5 |
| Module target | ES2017 / esnext modules / bundler resolution | (see [tsconfig.json](../../tsconfig.json)) |
| Path alias | `@/*` → project root | |

## Backend & data

| Concern | Choice | Version |
|---------|--------|---------|
| Database | MySQL / MariaDB | |
| ORM | Prisma | ^7.3.0 |
| Driver adapter | `@prisma/adapter-mariadb` | ^7.4.0 |
| Raw driver | `mariadb` | ^3.4.5 |
| Auth | NextAuth | ^4.24.13 |
| NextAuth Prisma adapter | `@auth/prisma-adapter` | ^2.11.1 |
| Password hashing | `bcrypt` | ^6.0.0 |
| Edge-safe JWT (official cookie) | `jose` | (pulled in via next-auth; used by [lib/official-jwt.ts](../../lib/official-jwt.ts)) |

Prisma 7 requires a driver adapter; the singleton in [lib/prisma.ts](../../lib/prisma.ts) wires `PrismaMariaDb` and caps the per-instance connection pool (`DB_CONNECTION_LIMIT`, default 3) because each serverless instance keeps its own pool. See [data-model.md](data-model.md) for the schema.

## Domain & utility libraries

- `geothai` ^3.0.1 + `i18n-iso-countries` ^7.14.0 — province / country data (geothai data files are bundled for serverless tracing via `outputFileTracingIncludes` in [next.config.ts](../../next.config.ts))
- `exceljs` ^4.4.0 + `papaparse` ^5.5.3 — spreadsheet / CSV import-export
- `@vercel/analytics` ^2.0.1 — web analytics

## Styling

| Concern | Choice |
|---------|--------|
| Engine | Tailwind CSS v4 |
| Animations | `tw-animate-css` |
| Component library | shadcn/ui (style: `new-york`), Radix UI primitives |
| Icon set | `lucide-react` |
| CSS variables | enabled |
| Tailwind config | `app/globals.css` (no separate `tailwind.config.*`) |

## UI building blocks

- **Form / interaction**:
  - `input-otp` — 6-character secret code entry
  - `framer-motion` — animation
  - `sonner` — toast notifications (`<Toaster>` mounted in `app/layout.tsx`)
  - `class-variance-authority`, `clsx`, `tailwind-merge` — class composition (`cn()` lives in [lib/utils.ts](../../lib/utils.ts))
- **Radix primitives in use**: `react-avatar`, `react-collapsible`, `react-dialog`, `react-dropdown-menu`, `react-popover`, `react-select`, `react-separator`, `react-slot`, `react-tooltip`

## Theme

- **Light theme** for the **admin** dashboard — bright, high-contrast for desk use.
- **Dark theme** for the **public scoreboard** and the in-event role workspaces (judge, head judge, event logger) — reduces glare at the venue.
- No user-controllable dark/light toggle (intentional; theme is fixed per route prefix).

## Language

- **Thai only.** The UI ships in Thai (`lang="th"`) with no language toggle.
- Documentation in [docs/](../) is written in English for maintainers; Thai terms used by the UI are listed in [product/glossary.md](../product/glossary.md) as a translation aid.

## Testing

| Concern | Choice | Version |
|---------|--------|---------|
| Test runner | `vitest` | ^4.1.8 |
| Coverage | `@vitest/coverage-v8` | |
| DOM env | `jsdom` | ^29.1.1 |
| React testing | `@testing-library/react` / `jest-dom` / `user-event` | |
| Path resolution | `vite-tsconfig-paths` | |

Run with `npm test` (`vitest run`) or `npm run test:coverage`.

## Linting

- `eslint` ^9
- `eslint-config-next` 16.0.6 — composes `core-web-vitals` and `typescript` configs in [eslint.config.mjs](../../eslint.config.mjs)
- Project rules: `@typescript-eslint/no-explicit-any` is an **error**; unused vars warn (ignore `^_`)
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `loadtest/**`, `coverage/**`

## Build / dev commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest |
| `npm run db:push` | Sync Prisma schema to DB (no migrations) |
| `npm run db:seed` / `db:seed:reset` | Seed / reset admin users |
| `npm run db:init-root` | Create the root admin |

## Notable design decisions

- **No form library** (no `react-hook-form`, no Zod). Forms use controlled `useState`. See [conventions/component-patterns.md](../conventions/component-patterns.md).
- **No global state library** and no app-state Context. See [overview.md](overview.md) and [state-and-data-flow.md](state-and-data-flow.md).
- **Writes are Server Actions** (`app/actions/*`); the public scoreboard reads a CDN-cached JSON route. See [state-and-data-flow.md](state-and-data-flow.md).
- **shadcn/ui style `new-york`** — modern, slightly tighter typography than the default.

## Configuration files of note

| File | What it does |
|------|--------------|
| [next.config.ts](../../next.config.ts) | Bundles geothai data files for serverless tracing |
| [tsconfig.json](../../tsconfig.json) | TS strict, `@/*` path alias |
| [eslint.config.mjs](../../eslint.config.mjs) | Next.js + TS lint rules |
| [components.json](../../components.json) | shadcn config (style `new-york`, base color neutral) |
| [postcss.config.mjs](../../postcss.config.mjs) | Tailwind v4 PostCSS plugin |
| [vitest.config.ts](../../vitest.config.ts) | Vitest + jsdom test config |

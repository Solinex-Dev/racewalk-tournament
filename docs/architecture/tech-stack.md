# Tech Stack

## Frameworks and runtime

| Concern | Choice | Version |
|---------|--------|---------|
| Framework | Next.js (App Router) | 16.0.7 |
| UI runtime | React | 19.2.0 |
| Language | TypeScript (strict) | 5.x |
| Module target | ES2017 / esnext modules / bundler resolution | (see `tsconfig.json`) |
| Path alias | `@/*` → project root | |

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
  - `class-variance-authority`, `clsx`, `tailwind-merge` — class composition (`cn()` lives in [lib/utils.ts](../../lib/utils.ts))
- **Radix primitives in use**: `react-avatar`, `react-collapsible`, `react-dialog`, `react-dropdown-menu`, `react-select`, `react-separator`, `react-slot`, `react-tooltip`

## Planned backend

| Concern | Choice |
|---------|--------|
| Database | MySQL |
| ORM | Prisma |

See [data-model.md](data-model.md) for the planned schema.

## Theme

- **Single light theme** for admin and public-facing pages — bright, high-contrast for spectators
- **Dark theme** for in-event role workspaces (judge, head judge, event logger, timekeeper) — reduces glare at venue
- No user-controllable dark/light toggle (intentional; theme is fixed per route prefix)

## Internationalization (i18n)

- Languages: **Thai (`th`)**, **English (`en`)**
- Toggle changes language immediately — no reload
- Approach: see [i18n.md](i18n.md)

## Linting

- `eslint` v9
- `eslint-config-next` 16.0.6 — extends `core-web-vitals` and `typescript`
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Build / dev commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm start` | Serve the production build |

No test runner is configured today.

## Notable design decisions

- **No form library** (no `react-hook-form`, no Zod). Forms use controlled `useState`. See [conventions/component-patterns.md](../conventions/component-patterns.md).
- **No global state library**. See [overview.md](overview.md) and [state-and-data-flow.md](state-and-data-flow.md).
- **shadcn/ui style `new-york`** — modern, slightly tighter typography than the default.

## Configuration files of note

| File | What it does |
|------|--------------|
| [next.config.ts](../../next.config.ts) | Minimal Next.js config |
| [tsconfig.json](../../tsconfig.json) | TS strict, `@/*` path alias |
| [eslint.config.mjs](../../eslint.config.mjs) | Next.js + TS lint rules |
| [components.json](../../components.json) | shadcn config |
| [postcss.config.mjs](../../postcss.config.mjs) | Tailwind v4 PostCSS plugin |

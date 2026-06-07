# Code Style

Project-level coding conventions. For the broader architecture rationale, see [../architecture/overview.md](../architecture/overview.md).

## Language

- **TypeScript strict mode** is on.
- Use the `@/*` path alias for imports from the project root (e.g. `import { cn } from "@/lib/utils"`).
- Prefer **type aliases** over interfaces unless declaration-merging is needed.

## File layout

- One default export per file when the file represents a route (`page.tsx`, `layout.tsx`).
- One named export per component file when the file is a component.
- Server Actions live in `app/actions/<entity>.ts` with `"use server"` at the top.
- Co-locate types with the component that owns them; promote to a shared types file only when reused.

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `JudgeWorkspace` |
| Files | kebab-case | `judge-workspace.tsx` |
| Hooks | camelCase, `use` prefix | `useIsMobile` |
| Constants (module-level) | SCREAMING_SNAKE_CASE | `MAX_YELLOW`, `MAX_RED`, `POLL_INTERVAL_MS` |
| Booleans | `is`/`has`/`can` prefix | `isFromThisJudge`, `canOverride` |

## Imports

- Group imports: external, then `@/...`, then relative.
- Avoid default imports for project components; named imports surface rename refactors more clearly.

## Comments

- **Default to no comments.** Self-documenting names are preferred.
- Add a one-line comment when the **why** is non-obvious (a domain rule, a workaround, a subtle invariant). The domain code does this — e.g. the BIB format rule and the metres↔km boundary conversion in `components/events/event-form.tsx`.
- Don't write what the code does; the code does that already.

## Forms

- Forms use **controlled inputs with `useState`**. No form library (no `react-hook-form`, no `formik`, no Zod).
- Submit handlers call a Server Action from `app/actions/*` inside `startTransition`, then `router.refresh()` / `router.push()`. Errors are caught and shown as Thai-language strings (via `setError` and/or a `sonner` `toast`).
- See [component-patterns.md](component-patterns.md) for the canonical shape.

## Client vs. server

- Pages default to **Server Components**; they read data directly from Prisma (`@/lib/prisma`).
- Add `"use client"` to a component only when it needs interaction (state, effects, event handlers, browser APIs, `framer-motion`, `next/navigation` client hooks).
- The common pattern: a server `page.tsx` queries Prisma and passes data as props to a client component.
- Writes never happen in client code directly — they go through Server Actions, which re-check authorization server-side.

## `params` in Next.js 16

`params` is now a `Promise<{...}>`. Unwrap once:

- In a server component: `const { eventId } = await props.params;`
- In a client component: `const { eventId } = use(props.params);`

## Units & data boundaries

- Distances are stored in **kilometres** (`distanceKm` columns) but the UI works in **metres**. Convert at the form boundary with `kmFromMeters` / `metersFromKm` from `@/lib/distance`.
- Times (lap/finish) are stored as **milliseconds** (`timeMs`) and formatted for display only.
- BIB is **event-scoped** (`EventAthlete.bib`, unique per event) and validated against the age-band format via `@/lib/bib`.

## Testing

- A **Vitest** runner is configured. `npm test` runs `vitest run`; `npm run test:coverage` adds coverage + lcov normalization.
- Tests use `@testing-library/react` + `jsdom`. Add tests for non-trivial pure logic (e.g. `lib/leaderboard.ts`, `lib/athlete-sort.ts`).

## ESLint

- Inherits from `eslint-config-next` (core-web-vitals + typescript).
- Run before commit: `npm run lint`.

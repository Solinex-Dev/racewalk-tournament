# Code Style

Project-level coding conventions. For the broader architecture rationale, see [../architecture/overview.md](../architecture/overview.md).

## Language

- **TypeScript strict mode** is on.
- Use the `@/*` path alias for imports from the project root (e.g. `import { cn } from "@/lib/utils"`).
- Prefer **type aliases** over interfaces unless declaration-merging is needed.

## File layout

- One default export per file when the file represents a route (`page.tsx`, `layout.tsx`).
- One named export per component file when the file is a component.
- Co-locate types with the component that owns them; promote to a shared types file only when reused.

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `JudgeWorkspace` |
| Files | kebab-case | `judge-workspace.tsx` |
| Hooks | camelCase, `use` prefix | `useIsMobile` |
| Constants (module-level) | SCREAMING_SNAKE_CASE | `MAX_YELLOW`, `MOCK_EVENTS` |
| Booleans | `is`/`has`/`can` prefix | `isFromThisJudge`, `canOverride` |

## Imports

- Group imports: external, then `@/...`, then relative.
- Avoid default imports for project components; named imports surface rename refactors more clearly.

## Comments

- **Default to no comments.** Self-documenting names are preferred.
- Add a one-line comment when the **why** is non-obvious (a domain rule, a workaround, a subtle invariant).
- Don't write what the code does; the code does that already.

## Forms

- Forms use **controlled inputs with `useState`**. No form library (no `react-hook-form`, no `formik`).
- See [component-patterns.md](component-patterns.md) for the canonical shape.

## Client vs. server

- Pages default to **Server Components**.
- Add `"use client"` to a component only when it needs interaction (state, effects, event handlers).
- The common pattern: a server `page.tsx` imports a client component and passes data as props.

## `params` in Next.js 16

`params` is now a `Promise<{...}>`. Unwrap once:

- In a server component: `const { eventId } = await props.params;`
- In a client component: `const { eventId } = use(props.params);`

## Mocks during prototype

- Inline mock constants are named `MOCK_*` so they can be grepped and removed during the real-data migration.
- Every place a mock is "written" (form submit, button action) uses `console.log` plus an `alert("... (mock)")` so the path is visible at runtime.
- These are tagged with `TODO` comments where appropriate.

## ESLint

- Inherits from `eslint-config-next` (core-web-vitals + typescript).
- Run before commit: `npm run lint`.

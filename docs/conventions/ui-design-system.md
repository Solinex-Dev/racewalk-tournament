# UI Design System

How visual choices are organized.

## Component library

- **shadcn/ui** (style: `new-york`) — primitives are copied into `components/ui/` and owned by the project. Edit them directly when needed; do not work around them.
- **Radix UI** — the unstyled primitives behind most shadcn components.
- **lucide-react** — icon set.

Adding new primitives: use `npx shadcn add <component>` to add another shadcn component into `components/ui/`.

## Configuration

[components.json](../../components.json) controls shadcn behavior:

| Option | Value |
|--------|-------|
| style | `new-york` |
| rsc | `true` (React Server Components) |
| tsx | `true` |
| tailwind.css | `app/globals.css` |
| tailwind.baseColor | `neutral` |
| tailwind.cssVariables | `true` |
| iconLibrary | `lucide` |

## Tailwind

- Version **4**. Configured via the PostCSS plugin in `postcss.config.mjs`.
- No separate `tailwind.config.*` — Tailwind v4 is config-light.
- Animations: `tw-animate-css`.

## Theming

- **Light theme** for admin and public surfaces. Slate-50 background, neutral typography.
- **Dark theme** for in-event role workspaces (judge, head judge, event logger, timekeeper). Slate-950 background.
- The theme is fixed per route prefix — there is **no user toggle**. See [../architecture/overview.md](../architecture/overview.md).

## Class composition

Use `cn()` from `@/lib/utils`:

```tsx
import { cn } from "@/lib/utils";
<div className={cn("rounded-md p-2", isActive && "bg-primary", className)} />
```

`cn()` is `clsx` + `tailwind-merge` — conditional classes plus conflict resolution.

## Card matrix visuals

The shared [`JudgeCardMatrix`](../../components/judge/card-matrix.tsx) defines the canonical look for cards everywhere:

- Yellow slots: `MAX_YELLOW = 2` (one per symbol)
- Red slots: `MAX_RED = 4` in aggregate; the moderator view passes a larger `maxRed` prop that scales by judge count
- Symbol rendered inside the slot: `>` (bent knee / เข่างอ) or `~` (lifted foot / ยกเท้า)
- "This judge's" red card gets a yellow ring (`isFromThisJudge` flag → `ring-1 ring-yellow-400`)
- Empty slots show as muted placeholders

`MAX_YELLOW` and `MAX_RED` are exported from `card-matrix.tsx`. When card visuals change, change `JudgeCardMatrix` and nothing else.

## Typography

Geist (variable, sans + mono) is loaded in `app/layout.tsx`. Use Tailwind's font utilities — do not import other fonts inline.

## Forms

- All inputs are shadcn components from `components/ui/` (`Input`, `Select`, `InputOTP`, `Combobox`, etc.).
- Forms use plain HTML `<form>` + controlled state, submitting via Server Actions. See [component-patterns.md](component-patterns.md).
- The 6-character secret-code join entry uses `InputOTP` (`components/judge/judge-join-form.tsx`).

## Toasts & feedback

- Toasts use **sonner**, mounted once in `app/layout.tsx` as `<Toaster position="top-right" richColors closeButton />`. Import `toast` from `sonner`.
- Inline validation errors render as Thai strings near the form (controlled `error` state), not via `alert()`.

## Iconography

Only `lucide-react`. Don't mix icon sets.

## Spacing scale

Stick to Tailwind defaults. Avoid arbitrary `p-[7px]` style values unless absolutely necessary — they break visual rhythm.

## Tables

Admin listings use a consistent table look (header row, zebra optional, per-row action menu). Replicate the existing pattern from `components/<entity>/<entity>-list.tsx`.

## Language

UI is **Thai only**. There is no language toggle and no i18n layer. Write Thai strings directly in components.

For internal identifiers (route paths, variable names, code comments, log messages), stay in English.

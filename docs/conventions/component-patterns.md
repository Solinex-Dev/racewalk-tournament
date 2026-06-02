# Component Patterns

The canonical patterns for adding a page or component in this codebase.

## Server page + client island

The most common pattern. A server page reads data (today: from a mock; tomorrow: from Prisma), then renders a thin shell that hands data to a client component.

```tsx
// app/judge/events/[eventId]/page.tsx  (server)
import { JudgeWorkspace } from "@/components/judge/judge-workspace";

export default async function Page(props: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await props.params;
  // server-side data fetch here
  return <JudgeWorkspace eventId={eventId} />;
}
```

```tsx
// components/judge/judge-workspace.tsx  (client)
"use client";
import { useState } from "react";

export function JudgeWorkspace({ eventId }: { eventId: string }) {
  const [athletes, setAthletes] = useState(INITIAL_ATHLETES);
  // ...
}
```

Why: keeps data fetching server-side and interaction client-side, with a clear handoff via props.

## Form pattern (controlled, no library)

Forms are plain controlled inputs with `useState`. No `react-hook-form`, no Zod.

```tsx
"use client";
import { useState } from "react";

export function AthleteForm() {
  const [name, setName] = useState("");
  const [bib, setBib] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: replace with real API call
    console.log("Mock save", { name, bib });
    alert("บันทึก (mock)");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Input value={bib} onChange={(e) => setBib(e.target.value)} />
      <Button type="submit">Save</Button>
    </form>
  );
}
```

When the codebase migrates off mocks, **server actions** are the planned write path. The form's `onSubmit` will call the action; the per-field `useState` stays.

## Page docs the same shape

Every page doc (under [pages/](../pages/)) uses the template described in [../pages/README.md](../pages/README.md). Keep this consistent — it's what makes the docs cross-link uniformly.

## Component family pattern (admin CRUD)

Each manageable entity has a triple in `components/<entity>/`:

| File | Role |
|------|------|
| `<entity>-list.tsx` | Table view; server component |
| `<entity>-form.tsx` | Create/edit form; client component |
| (no separate detail component) | List + form covers the use case |

Pages in `app/admin/(pages)/<entity>/` consume these. Example: `components/athletes/athletes-list.tsx` and `athlete-form.tsx`.

## Shared card matrix

[`JudgeCardMatrix`](../../components/judge/card-matrix.tsx) is the **single component** used to render cards everywhere they appear (judge workspace, head judge view, moderator, public scoreboard).

When changing card visuals, change this one component. Do **not** duplicate the markup elsewhere.

## Sidebar in admin layout

The admin layout (`app/admin/(pages)/layout.tsx`) wraps everything with `DashboardSidebar` from `components/partials/admin-sidebar/`. Adding a new admin page typically means:

1. Add the route under `app/admin/(pages)/...`.
2. Add a nav item in [components/partials/admin-sidebar/nav-main.tsx](../../components/partials/admin-sidebar/nav-main.tsx).

## When to extract a component

- Used in 2+ places? Extract.
- Used in 1 place but > ~120 lines? Consider extracting if it has its own state or has natural sub-sections.
- Otherwise leave it inline.

Resist the temptation to extract "for testability" — there is no test runner today, and abstraction without callers is dead weight.

## When to add `"use client"`

Add when the component:

- Uses `useState`, `useEffect`, `useRef`, or other React hooks
- Uses event handlers like `onClick`, `onChange`
- Uses browser-only APIs (`window`, `document`)
- Uses `framer-motion`, `next/navigation` client hooks, etc.

Otherwise leave it server.

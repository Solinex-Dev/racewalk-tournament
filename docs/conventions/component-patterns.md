# Component Patterns

The canonical patterns for adding a page or component in this codebase.

## Server page + client island

The most common pattern. A server page reads data from Prisma, then renders a thin shell that hands data to a client component.

```tsx
// app/judge/events/[eventId]/page.tsx  (server)
import { JudgeWorkspace } from "@/components/judge/judge-workspace";

export default async function Page(props: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await props.params;
  // server-side Prisma reads here (round, athletes, cards, ...)
  return <JudgeWorkspace eventId={eventId} /* + data props */ />;
}
```

```tsx
// components/judge/judge-workspace.tsx  (client)
"use client";
import { useState } from "react";

export function JudgeWorkspace({ eventId }: { eventId: string }) {
  const [athletes, setAthletes] = useState(initialAthletes);
  // ...
}
```

Why: keeps data fetching server-side and interaction client-side, with a clear handoff via props.

## Form pattern (controlled, no library)

Forms are plain controlled inputs with `useState` — no `react-hook-form`, no Zod. The submit handler calls a **Server Action** from `app/actions/*` inside `startTransition`, refreshes the route, and surfaces errors as Thai strings.

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/app/actions/events";

export function EventForm({ mode, eventId }: { mode: "create" | "edit"; eventId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && eventId) {
          await updateEvent(eventId, { name });
          router.refresh();
        } else {
          const result = await createEvent({ name });
          router.push(`/admin/events/${result.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return <form onSubmit={handleSubmit}>{/* controlled Inputs */}</form>;
}
```

The Server Action (`"use server"`) re-checks authorization with `requirePermission(...)`, mutates Prisma, logs via `logCurrentAdmin`, and revalidates (`revalidatePath` for admin views, or `revalidateRaceDayViews` for race-day writes). The form never talks to the DB directly. See `components/events/event-form.tsx` and `components/athletes/athlete-form.tsx` for real examples.

## Page docs the same shape

Every page doc (under [pages/](../pages/)) uses the template described in [../pages/README.md](../pages/README.md). Keep this consistent — it's what makes the docs cross-link uniformly.

## Component family pattern (admin CRUD)

Each manageable entity has a pair in `components/<entity>/`:

| File | Role |
|------|------|
| `<entity>-list.tsx` | Table view; client component (search/filter state), rows passed in as props |
| `<entity>-form.tsx` | Create/edit form; client component, calls the Server Action |
| (no separate detail component) | List + form covers the use case |

The server `page.tsx` in `app/admin/(pages)/<entity>/` does the Prisma read and the permission gate (`getCurrentAdmin()` + `canAccessResource`), then passes rows down. Example: `components/athletes/athletes-list.tsx` and `athlete-form.tsx`, consumed by `app/admin/(pages)/athletes/page.tsx`.

## Real-time refresh

Two distinct mechanisms, both client-side:

- **Official workspaces** (judge / head-judge / event-logger) use [`AutoRefresh`](../../components/common/auto-refresh.tsx) → `router.refresh()` on an interval. The three workspace pages pass `intervalMs={round.status === "SCHEDULED" ? 2000 : 2500}`.
- **Public scoreboard** ([`LiveBoard`](../../components/events/live-board.tsx)) does **not** use `router.refresh()`. It holds the DTO in `useState` and polls the CDN-cached JSON route [`/api/events/[eventId]/leaderboard`](../../app/api/events/[eventId]/leaderboard/route.ts) every `POLL_INTERVAL_MS = 5000` with an `AbortController`, keeping the last good state on error. The DTO shape is built by [`lib/leaderboard.ts`](../../lib/leaderboard.ts).

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

A Vitest runner exists, so extracting genuinely reusable logic for tests is reasonable — but still resist extracting UI "for testability" when there's only one caller; abstraction without callers is dead weight.

## When to add `"use client"`

Add when the component:

- Uses `useState`, `useEffect`, `useRef`, `useTransition`, or other React hooks
- Uses event handlers like `onClick`, `onChange`
- Uses browser-only APIs (`window`, `document`)
- Uses `framer-motion`, `next/navigation` client hooks, etc.

Otherwise leave it server.

# State & Data Flow

How data moves through the system today, and the plan for replacing the mocks with a real backend.

## Today: UI prototype with mocks

All data is held in:

1. **Inline `MOCK_*` constants** in page files — for read-only display
2. **Component-level `useState`** — for interactive workspaces
3. **`console.log` + `alert("...(mock)")`** — for write actions

No backend, no persistence, no sync between users.

### Mock data inventory

| Location | Constants |
|----------|-----------|
| [app/events/[eventId]/page.tsx](../../app/events/[eventId]/page.tsx) | `MOCK_PUBLIC_EVENT` |
| [app/admin/(pages)/events/page.tsx](../../app/admin/(pages)/events/page.tsx) | `MOCK_EVENTS` (22 events) |
| [app/admin/(pages)/admins/page.tsx](../../app/admin/(pages)/admins/page.tsx) | `MOCK_ADMINS` |
| [app/admin/(pages)/events/[eventId]/moderator/page.tsx](../../app/admin/(pages)/events/[eventId]/moderator/page.tsx) | `MOCK_EVENT_STATUS`, `MOCK_ATHLETES_BY_ROUND`, `MOCK_JUDGES_BY_ROUND`, `MOCK_ACTIVITY_LOGS`, `MOCK_PENDING_RED_CARDS` |
| [app/head-judge/events/[eventId]/page.tsx](../../app/head-judge/events/[eventId]/page.tsx) | `MOCK_EVENT_STATUS`, `MOCK_ATHLETES_BY_ROUND`, `MOCK_JUDGES_BY_ROUND`, `MOCK_ACTIVITY_LOGS` |
| [app/event-logger/events/[eventId]/page.tsx](../../app/event-logger/events/[eventId]/page.tsx) | `MOCK_EVENT_STATUS`, `MOCK_ATHLETES_BY_ROUND`, `MOCK_ACTIVITY_LOGS` |
| [app/judge/events/[eventId]/page.tsx](../../app/judge/events/[eventId]/page.tsx) | `MOCK_JUDGE_EVENT_INFO` |
| [components/judge/judge-workspace.tsx](../../components/judge/judge-workspace.tsx) | `INITIAL_ATHLETES` |
| [app/timekeeper/events/[eventId]/page.tsx](../../app/timekeeper/events/[eventId]/page.tsx) | `INITIAL_ATHLETES` |
| [components/rounds/round-form.tsx](../../components/rounds/round-form.tsx) | `MOCK_ATHLETE_OPTIONS`, `MOCK_JUDGE_OPTIONS` |
| [components/judge/judge-join-form.tsx](../../components/judge/judge-join-form.tsx) | `MOCK_CODE_DESTINATIONS` |

Every `TODO` comment in the code marks where a real API/database call will replace the mock.

## Tomorrow: Prisma + MySQL

### Read path

```
Server Component
  └─ await prisma.event.findUnique(...)
  └─ pass props to Client Component
```

Most listing and detail pages can be pure server components — they read from Prisma at render time, no client-side fetching.

### Write path

Two options under consideration:

1. **Server actions** — co-located with the form, server-side validation, automatic revalidation.
2. **Route handlers** (`app/api/.../route.ts`) — REST endpoints, called from client components.

Probably **server actions for admin CRUD** (low frequency, form-driven) and **route handlers for the live workspaces** (higher frequency, JSON-driven).

### Real-time sync

The hard problem. Today, no two users see each other's data:

- A judge issues a card — nobody else sees it
- A head judge confirms — nobody else sees it
- The public scoreboard is frozen

For production, judges' card issuance must propagate to:

- Other judges' workspaces (so they see aggregate count and DQ state)
- Head judge workspace (to confirm/override)
- Moderator page (admin oversight)
- Public scoreboard (live)

Options:

| Option | Pros | Cons |
|--------|------|------|
| **Polling** (every 1–3s) | Simple; works behind any infra | Wasteful; not truly real-time |
| **Server-Sent Events (SSE)** | One-way real-time, easy on Next.js | One-way; can't push from client |
| **WebSocket** | Two-way real-time | Needs sticky-session or external broker |
| **Pusher / Ably (managed)** | Offloads infra | Cost; vendor lock-in |

Decision pending — see [decisions/](../decisions/).

## Migration sequence

Recommended order to wire up real data:

1. **Admin CRUD first** — events, athletes, judges, affiliations, admins. Low-frequency, form-driven. Use server actions.
2. **Round configuration** — depends on (1). Generates and stores secret codes.
3. **Join flows** — validate codes server-side against `RoundOfficial.secret_code`.
4. **Card scoring writes** — judge workspace issues cards via route handler.
5. **Real-time sync layer** — chosen mechanism; replaces polling/refresh.
6. **Lap times** — similar to (4).
7. **Public scoreboard** — initially polls; later subscribes.
8. **Reports / export** — read-only, batch.

Each step replaces a `console.log` / `alert` with a real call. Mock constants stay in place until each consumer is migrated, so the UI never breaks.

## Where state lives — current rules

- **Server pages** hold no state.
- **Client components** hold `useState` for the bits they need.
- **No Context**, **no global store**.
- **Activity log** is recreated separately in each consuming page (head judge, event logger, moderator) — once real, this will be one source of truth.

This works for the prototype. Once real-time sync lands, expect a thin Context (or a query library like SWR / TanStack Query) to wrap the read-and-subscribe pattern.

# Adding a Feature

A worked example of how to introduce a new feature, end-to-end, in this codebase.

Use this when you're adding a new page, a new admin entity, or a new in-event capability.

The app is fully wired to a Prisma backend: reads are Prisma queries in Server Components, and writes are Server Actions in `app/actions/*`. The steps below assume real data, not mocks.

## 1. Update the docs first

This sounds backwards, but it's faster:

1. Add a new file under [features/](../features/) describing the capability. Use the header block (Status, Roles, Routes, Entities, Related features).
2. Add a row in [features/README.md](../features/README.md) — both the index table and the feature × page matrix.
3. If a new page is involved, add a page doc under [pages/](../pages/) and a row in [pages/README.md](../pages/README.md).
4. If the feature changes a persona's behavior, update the relevant [personas/](../personas/) doc.

This grounds the work. If you can't write the docs, you don't know the feature yet.

## 2. Update the data model

Open [architecture/data-model.md](../architecture/data-model.md) and add the new entities or fields, then add the corresponding models/columns to `prisma/schema.prisma`. Decide the shape now — it's hard to change later.

Sync the schema locally with `npm run db:push` (prefer this over `prisma migrate` for local work; see [CLAUDE.md](../../CLAUDE.md)). Don't hand-write `migration.sql`.

## 3. Add the route(s)

For an admin entity called `Sponsor`:

```
app/admin/(pages)/sponsors/
├── page.tsx                     ← list (server, queries Prisma)
├── new/page.tsx                 ← create (server, wraps SponsorForm)
└── [sponsorId]/page.tsx         ← edit (server, wraps SponsorForm)
```

The list/detail `page.tsx` is a Server Component that calls `prisma.sponsor.findMany(...)` (filter `deletedAt: null` for soft-deleted entities) and gates access with `getCurrentAdmin()` + `canAccessResource(me, "sponsors")` from [lib/authz.ts](../../lib/authz.ts) / [lib/permissions.ts](../../lib/permissions.ts).

For an in-event role feature, add under the role's tree (`app/judge/...`, `app/event-logger/...`, etc.).

## 4. Add the components

```
components/sponsors/
├── sponsors-list.tsx            ← table (client; filtering/search state)
└── sponsor-form.tsx             ← create/edit form (client, "use client")
```

The form submits through a **Server Action** — see step 5. The list reads its rows from props passed down by the server `page.tsx`.

## 5. Add the Server Action (the write path)

Create `app/actions/sponsors.ts` with `"use server"` at the top. Each mutating function:

1. Calls `requirePermission("sponsors", "create" | "edit" | "delete")` ([lib/authz.ts](../../lib/authz.ts)) — throws a Thai-language error on denial.
2. Mutates via Prisma (soft-delete sets `deletedAt`; never hard-delete domain rows).
3. Writes an admin audit row via `logCurrentAdmin(...)` ([lib/activity-log.ts](../../lib/activity-log.ts)).
4. Invalidates caches: `revalidatePath("/admin/sponsors")` for admin views. Race-day actions that affect the live board instead call `revalidateRaceDayViews(eventId)` ([lib/revalidate-race-day.ts](../../lib/revalidate-race-day.ts)), which revalidates the role paths and purges the leaderboard cache tag.

The form's `onSubmit` calls the action inside `startTransition(async () => { ... })`, then `router.refresh()` (edit) or `router.push(...)` (create), and surfaces errors via `setError`/`toast`. See [component-patterns.md](component-patterns.md) for the canonical shape.

## 6. Wire navigation

If admin: add a nav entry in [components/partials/admin-sidebar/nav-main.tsx](../../components/partials/admin-sidebar/nav-main.tsx).

## 7. Cross-link docs

Add `[sponsor-mgmt](../features/sponsor-mgmt.md)` references in any related pages and personas.

## 8. Run

```bash
npm run dev
npm run lint
npm test
```

Click through every page you added. Confirm the Server Action actually persists (the row survives a refresh) and that permission gating blocks an admin without the resource.

## Decision points worth pausing on

- **Does this need its own page, or is it a section in an existing one?** Page-shaped features earn a page doc; section-shaped ones go into an existing page's "UI Sections" list.
- **Is this a feature or just a UI tweak?** A feature has a verb and a behavior. "Make the table sortable" is a tweak. "Allow CSV import of athletes" is a feature.
- **Which role(s) does this expand?** If a new role surfaces, you also need a new persona doc and a join page.
- **Does it touch the live board?** If a write should change what spectators or officials see, it must invalidate the right cache — admin paths via `revalidatePath`, race-day views via `revalidateRaceDayViews`.

## Anti-patterns to avoid

- **Don't create a new component "to be safe."** If the existing pattern works, use it.
- **Don't extract reusable code prematurely.** Wait for the second usage.
- **Don't ship without updating the docs.** Docs lagging behind code is how this project becomes hard to navigate.
- **Don't bypass `requirePermission` in a Server Action.** Every admin write is authorized server-side; the JWT trust window means client role is not enough.
- **Don't introduce a new state library**, animation library, or icon library casually. The choice is intentional — see [tech-stack.md](../architecture/tech-stack.md).

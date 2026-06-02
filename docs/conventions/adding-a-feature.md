# Adding a Feature

A worked example of how to introduce a new feature, end-to-end, in this codebase.

Use this when you're adding a new page, a new admin entity, or a new in-event capability.

## 1. Update the docs first

This sounds backwards, but it's faster:

1. Add a new file under [features/](../features/) describing the capability. Use the header block (Status, Roles, Routes, Entities, Related features).
2. Add a row in [features/README.md](../features/README.md) — both the index table and the feature × page matrix.
3. If a new page is involved, add a page doc under [pages/](../pages/) and a row in [pages/README.md](../pages/README.md).
4. If the feature changes a persona's behavior, update the relevant [personas/](../personas/) doc.

This grounds the work. If you can't write the docs, you don't know the feature yet.

## 2. Sketch the data model

Open [architecture/data-model.md](../architecture/data-model.md) and add the new entities or fields. Even with mocks, decide the shape now — it's hard to change later.

## 3. Add the route(s)

For an admin entity called `Sponsor`:

```
app/admin/(pages)/sponsors/
├── page.tsx                     ← list (server)
├── new/page.tsx                 ← create (server, wraps SponsorForm)
└── [sponsorId]/page.tsx         ← edit (server, wraps SponsorForm)
```

For an in-event role feature, add under the role's tree.

## 4. Add the components

```
components/sponsors/
├── sponsors-list.tsx            ← table (server)
└── sponsor-form.tsx             ← create/edit form (client, "use client")
```

Form mocks its save with `console.log` + `alert("บันทึก (mock)")`. List reads from a `MOCK_SPONSORS` constant.

## 5. Wire navigation

If admin: add a nav entry in [components/partials/admin-sidebar/nav-main.tsx](../../components/partials/admin-sidebar/nav-main.tsx).

## 6. Cross-link docs

Add `[sponsor-mgmt](../features/sponsor-mgmt.md)` references in any related pages and personas.

## 7. Run

```bash
npm run dev
npm run lint
```

Click through every page you added. Confirm the mock action shows the `(mock)` alert.

## 8. Plan the real-data step

When this feature graduates from mock to real:

- Replace `MOCK_SPONSORS` with a Prisma query in `page.tsx`.
- Replace the form's mock `handleSubmit` with a server action (or route handler call).
- Update the feature doc: change `Status: UI only` to `Status: Implemented`.

## Decision points worth pausing on

- **Does this need its own page, or is it a section in an existing one?** Page-shaped features earn a page doc; section-shaped ones go into an existing page's "UI Sections" list.
- **Is this a feature or just a UI tweak?** A feature has a verb and a behavior. "Make the table sortable" is a tweak. "Allow CSV import of athletes" is a feature.
- **Which role(s) does this expand?** If a new role surfaces, you also need a new persona doc and a join page.

## Anti-patterns to avoid

- **Don't create a new component "to be safe."** If the existing pattern works, use it.
- **Don't extract reusable code prematurely.** Wait for the second usage.
- **Don't ship without updating the docs.** Docs lagging behind code is how this project becomes hard to navigate.
- **Don't introduce a new state library**, animation library, or icon library casually. The choice is intentional — see [tech-stack.md](../architecture/tech-stack.md).

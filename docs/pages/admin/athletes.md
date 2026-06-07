# Admin · Athletes (List / New / Edit)

**Status**: Implemented (Prisma-backed, permission-gated)

**Routes**:
- `/admin/athletes` (list)
- `/admin/athletes/new` (create)
- `/admin/athletes/[athleteId]` (edit)

**Role**: [admin](../../personas/admin.md) (gated by the `athletes` permission resource)
**Type**: Server pages, Client `AthleteForm`
**Code**:
- [app/admin/(pages)/athletes/page.tsx](../../../app/admin/(pages)/athletes/page.tsx)
- [app/admin/(pages)/athletes/new/page.tsx](../../../app/admin/(pages)/athletes/new/page.tsx)
- [app/admin/(pages)/athletes/[athleteId]/page.tsx](../../../app/admin/(pages)/athletes/[athleteId]/page.tsx)
- [components/athletes/athlete-form.tsx](../../../components/athletes/athlete-form.tsx)
- [components/athletes/athletes-list.tsx](../../../components/athletes/athletes-list.tsx)
- [app/actions/athletes.ts](../../../app/actions/athletes.ts) (Server Actions)

## Purpose

CRUD for the athlete pool — the `Athlete` records that can be registered into events and assigned into rounds.

Note: **BIB is not stored on the athlete.** BIB lives on `EventAthlete` (event-scoped, unique per `(eventId, bib)`) and is assigned when registering an athlete to an event on the Event form — not here.

## Access Control

The Server Component resolves `getCurrentAdmin()` and renders `<NoAccess />` unless the viewer can access the `athletes` resource. The "+ เพิ่มนักกีฬาใหม่" button and the form's Edit/Delete buttons follow `create` / `edit` / `delete` permissions. CSV export/import is offered only to Root Admins.

## UI Sections

**List** ([athletes-list.tsx](../../../components/athletes/athletes-list.tsx)):
- Searchable, filterable, paginated table (10 per page)
- Columns: name (prefix + first/middle/last), affiliation, club, country, province
- Filters: country, province, affiliation, club
- New button → `/admin/athletes/new`; per-row view/edit link

**Form (new/edit)** ([athlete-form.tsx](../../../components/athletes/athlete-form.tsx)):
- Person name fields (prefix / first / middle / last), country (combobox), province (Thai only), affiliation reference, club, note
- Validation + feedback via `sonner` toasts

## Data Displayed

Source: live Prisma query (`prisma.athlete.findMany` where `deletedAt: null`, including the affiliation name). Country codes render through `countryLabel`.

## Actions

Writes are Server Actions in [app/actions/athletes.ts](../../../app/actions/athletes.ts), each guarded by `requirePermission("athletes", …)` and logged via `logCurrentAdmin`:

- `createAthlete` / `updateAthlete` — compose the denormalized `name` from the name parts, normalize country (default `TH`), stamp `createdById` / `updatedById`.
- `deleteAthlete` — **soft-delete** (sets `deletedAt`).

Each action calls `revalidatePath("/admin/athletes")` (and the detail path on edit). CSV bulk import/export for athletes is available to Root Admins via `app/actions/csv-import.ts` (two-phase preview/commit, all-or-nothing transaction, `MAX_ROWS = 5000`) and the `/api/admin/export/athletes` route.

## Features Surfaced

- [athlete-affiliation-mgmt](../../features/athlete-affiliation-mgmt.md) (primary)

## TODOs

- Photo upload
- Restore flow for soft-deleted athletes

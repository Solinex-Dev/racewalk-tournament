# Admin · Affiliations (List / New / Edit)

**Status**: Implemented (Prisma-backed, permission-gated)

**Routes**:
- `/admin/affiliations`
- `/admin/affiliations/new`
- `/admin/affiliations/[affiliationId]`

**Role**: [admin](../../personas/admin.md) (gated by the `affiliations` permission resource)
**Type**: Server pages, Client `AffiliationForm`
**Code**:
- [app/admin/(pages)/affiliations/page.tsx](../../../app/admin/(pages)/affiliations/page.tsx)
- [app/admin/(pages)/affiliations/new/page.tsx](../../../app/admin/(pages)/affiliations/new/page.tsx)
- [app/admin/(pages)/affiliations/[affiliationId]/page.tsx](../../../app/admin/(pages)/affiliations/[affiliationId]/page.tsx)
- [components/affiliations/affiliation-form.tsx](../../../components/affiliations/affiliation-form.tsx)
- [app/actions/affiliations.ts](../../../app/actions/affiliations.ts) (Server Actions)

## Purpose

CRUD for the `Affiliation` model — the clubs / schools / representative bodies that athletes belong to. Each affiliation may name a **head of affiliation**, which is stored as a reference to a `Judge` (named relation `AffiliationHead`).

## Access Control

The Server Component resolves `getCurrentAdmin()` and renders `<NoAccess />` unless the viewer can access the `affiliations` resource. The "+ เพิ่มสังกัด" button and the form's Edit/Delete buttons are shown per `create` / `edit` / `delete` permission. CSV export/import is offered only to Root Admins.

## UI Sections

**List**: searchable, filterable, paginated table of live affiliations. Columns include name, country (localized label), province, head-of-affiliation name, and joined date.

**Form** ([affiliation-form.tsx](../../../components/affiliations/affiliation-form.tsx)): name (required), country (combobox via `i18n-iso-countries`), province (Thai provinces via combobox; enabled only when country is TH), head of affiliation (combobox over judges, with an inline "create new judge" dialog that calls `createJudge`), joined-at date, and a note. Validation and success/error feedback use `sonner` toasts.

## Data Displayed

Source: live Prisma query (`prisma.affiliation.findMany` where `deletedAt: null`, including the head judge's name). Country codes are rendered through `countryLabel`.

## Actions

Writes are Server Actions in [app/actions/affiliations.ts](../../../app/actions/affiliations.ts), each guarded by `requirePermission("affiliations", …)` and logged via `logCurrentAdmin`:

- `createAffiliation` / `updateAffiliation` — validate the name, normalize country (default `TH`), parse the joined date, and stamp `createdById` / `updatedById`.
- `deleteAffiliation` — **soft-delete** (sets `deletedAt`); the row is retained so existing athlete references survive.

Each action calls `revalidatePath("/admin/affiliations")` (and the detail path on edit). CSV bulk import/export for affiliations is available to Root Admins via `app/actions/csv-import.ts` and the `/api/admin/export/affiliations` route.

## Features Surfaced

- [athlete-affiliation-mgmt](../../features/athlete-affiliation-mgmt.md) (primary)

## TODOs

- Decide cleanup behavior for athletes still referencing a soft-deleted affiliation
- Logo upload (for scoreboard display)

# Admin · Judges (List / New / Edit)

**Status**: Implemented (Prisma-backed, permission-gated)

**Routes**:
- `/admin/judges`
- `/admin/judges/new`
- `/admin/judges/[judgeId]`

**Role**: [admin](../../personas/admin.md) (gated by the `judges` permission resource)
**Type**: Server pages, Client `JudgeForm`
**Code**:
- [app/admin/(pages)/judges/page.tsx](../../../app/admin/(pages)/judges/page.tsx)
- [app/admin/(pages)/judges/new/page.tsx](../../../app/admin/(pages)/judges/new/page.tsx)
- [app/admin/(pages)/judges/[judgeId]/page.tsx](../../../app/admin/(pages)/judges/[judgeId]/page.tsx)
- [components/judges/judge-form.tsx](../../../components/judges/judge-form.tsx)
- [components/judges/judges-list.tsx](../../../components/judges/judges-list.tsx)
- [components/judges/org-department-manager.tsx](../../../components/judges/org-department-manager.tsx)
- [app/actions/judges.ts](../../../app/actions/judges.ts), [app/actions/organizations.ts](../../../app/actions/organizations.ts) (Server Actions)

## Purpose

CRUD for the pool of people who can serve as officials (judge, head judge, event logger, timekeeper). **Position is not stored here** — it is assigned per round on the Round form, which also generates each official's secret join code. The `Judge` record also backs the head-of-affiliation reference.

## Access Control

The Server Component resolves `getCurrentAdmin()` and renders `<NoAccess />` unless the viewer can access the `judges` resource. The "+ เพิ่มกรรมการใหม่" button and the form's Edit/Delete buttons follow `create` / `edit` / `delete` permissions. The Organization/Department manager and CSV export/import are surfaced accordingly (CSV import/export is Root-only).

## UI Sections

**List** ([judges-list.tsx](../../../components/judges/judges-list.tsx)): searchable, filterable, paginated table. Columns include name, country, province, organization, department, and operational status (`ACTIVE` / `INACTIVE`).

**Form** ([judge-form.tsx](../../../components/judges/judge-form.tsx)): person name fields, country, province (Thai only), organization + department (the department must belong to the chosen organization — enforced server-side), operational status, and note.

**Org / Department manager** ([org-department-manager.tsx](../../../components/judges/org-department-manager.tsx)): manages the `Organization → Department` hierarchy that judges are slotted into.

## Data Displayed

Source: live Prisma query (`prisma.judge.findMany` where `deletedAt: null`, including organization + department names), fetched in parallel with `getOrganizationsTree()`.

## Actions

Writes are Server Actions in [app/actions/judges.ts](../../../app/actions/judges.ts) (and [organizations.ts](../../../app/actions/organizations.ts) for the org/department hierarchy, also gated under the `judges` resource), each guarded by `requirePermission("judges", …)` and logged via `logCurrentAdmin`:

- `createJudge` / `updateJudge` — compose the denormalized `name`, validate the org→department relationship, normalize country (default `TH`), stamp `createdById` / `updatedById`.
- `deleteJudge` — **soft-delete** (sets `deletedAt`). Note `JudgeStatus` (`ACTIVE`/`INACTIVE`) is a separate operational flag — INACTIVE judges are hidden from dropdowns but kept.

Each action calls `revalidatePath("/admin/judges")` (and the detail path on edit). CSV bulk import/export for judges is available to Root Admins via `app/actions/csv-import.ts` (org/department auto-created by name) and the `/api/admin/export/judges` route.

## Features Surfaced

- [judge-mgmt](../../features/judge-mgmt.md) (primary)

## TODOs

- Certification tracking
- Availability calendar
- Contact info fields

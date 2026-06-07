# Judge Management

**Status**: Implemented
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/judges`, `/admin/judges/new`, `/admin/judges/[judgeId]`
**Entities**: `Judge`, `Organization`, `Department`
**Code**: [app/actions/judges.ts](../../app/actions/judges.ts), [app/actions/organizations.ts](../../app/actions/organizations.ts), [app/actions/csv-import.ts](../../app/actions/csv-import.ts)
**Related features**: [round-configuration](round-configuration.md) (judges assigned to rounds with positions), [secret-code-access](secret-code-access.md)

## Overview

CRUD for the **pool of officials** available to assign into rounds. A record here represents a person who can serve as a judge, head judge, or event logger — the specific position is chosen per round when the person is assigned (see [round-configuration](round-configuration.md)).

Judges are also organized into an **Organization → Department** hierarchy, managed from the same judges page.

## Judge entity

Backed by the Prisma `Judge` model:

```typescript
Judge {
  id: string;
  name: string;          // denormalized display name, composed from the parts below
  prefix?; firstName?; middleName?; lastName?;
  country: string;       // default "TH"
  province?; note?;
  organizationId?: string;
  departmentId?: string;
  status: "ACTIVE" | "INACTIVE";   // operational status (distinct from deletedAt)
  // standard audit/soft-delete: createdAt, updatedAt, deletedAt?, createdById?, updatedById?
}
```

A judge record does **not** carry a fixed round position. Position (`JUDGE` / `HEAD_JUDGE` / `EVENT_LOGGER`) is per-round; see [round-configuration](round-configuration.md). `status: INACTIVE` hides a judge from assignment dropdowns while keeping the record (distinct from the soft-delete `deletedAt`).

Form: [judge-form.tsx](../../components/judges/judge-form.tsx). List: [judges-list.tsx](../../components/judges/judges-list.tsx). The list/detail pages are Server Components reading `prisma.judge` directly.

## Organization & Department

`Organization` (e.g. a federation/association) contains `Department` rows (e.g. a field-judges section); `@@unique([organizationId, name])` keeps department names unique within an org. A judge may point at both `organizationId` and `departmentId` (both nullable); when a department is chosen, `buildJudgeData` validates it belongs to the chosen organization and adopts the department's org.

Org/dept CRUD lives in [app/actions/organizations.ts](../../app/actions/organizations.ts) (`create/update/deleteOrganization`, `create/update/deleteDepartment`). Permission is gated under the **`judges`** resource (they exist to organize judges). Deleting an org/dept soft-deletes it and nulls the affected judges' `organizationId` / `departmentId`.

## Writes

Judge writes go through the **Server Actions** in [app/actions/judges.ts](../../app/actions/judges.ts): `createJudge`, `updateJudge`, `deleteJudge`. Each requires `requirePermission("judges", "create" | "edit" | "delete")`, composes `name` via `composeName`, writes an audit row (`JUDGE_*`), and calls `revalidatePath`. **Delete is a soft delete** (`deletedAt`).

Judges can also be bulk-imported from CSV via [app/actions/csv-import.ts](../../app/actions/csv-import.ts) (`previewJudgeImport` / `commitJudgeImport`, **Root-Admin-only**); the importer auto-creates organizations by exact name and departments by org+name as needed. CSV export is at `app/api/admin/export/judges`.

## Pages

- [Judges list / new / edit](../pages/admin/judges.md)

## TODOs before production

- Certification tracking (federation-issued judging levels).
- Availability calendar to prevent double-booking across rounds (a same-time schedule conflict on shared judges is already checked at round save — see `lib/scheduling.ts` — but there is no standalone availability view).
- Contact info (phone, email) for last-minute coordination.

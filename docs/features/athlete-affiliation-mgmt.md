# Athlete & Affiliation Management

**Status**: Implemented
**Roles**: [admin](../personas/admin.md)
**Routes**:
- `/admin/athletes`, `/admin/athletes/new`, `/admin/athletes/[athleteId]`
- `/admin/affiliations`, `/admin/affiliations/new`, `/admin/affiliations/[affiliationId]`
**Entities**: `Athlete`, `Affiliation`
**Code**: [app/actions/athletes.ts](../../app/actions/athletes.ts), [app/actions/affiliations.ts](../../app/actions/affiliations.ts), [app/actions/csv-import.ts](../../app/actions/csv-import.ts)
**Related features**: [event-management](event-management.md) (athletes registered with a BIB), [round-configuration](round-configuration.md) (athletes drawn into rounds), [judge-mgmt](judge-mgmt.md) (an affiliation's head is a Judge)

## Overview

CRUD for the two reference entities that get reused across events:

- **Athlete** — the competitor (name parts, country/province, club, affiliation reference). **BIB is not stored here** — it is assigned per event on `EventAthlete` (see [event-management](event-management.md)).
- **Affiliation** — the club/school/body an athlete represents; its head is a `Judge` (named relation `AffiliationHead`).

Both live outside any specific event so they can be reused across events and seasons.

## Athlete

Backed by the Prisma `Athlete` model:

```typescript
Athlete {
  id: string;
  name: string;          // denormalized display name, composed from the parts below
  prefix?; firstName?; middleName?; lastName?;
  country: string;       // default "TH"
  province?; club?; note?;
  affiliationId?: string;
  // standard audit/soft-delete: createdAt, updatedAt, deletedAt?, createdById?, updatedById?
}
```

Form: [athlete-form.tsx](../../components/athletes/athlete-form.tsx). List: [athletes-list.tsx](../../components/athletes/athletes-list.tsx). The list/detail pages are Server Components reading `prisma.athlete` directly (filtered `deletedAt: null`).

Writes go through the **Server Actions** in [app/actions/athletes.ts](../../app/actions/athletes.ts): `createAthlete`, `updateAthlete`, `deleteAthlete`. Each requires `requirePermission("athletes", "create" | "edit" | "delete")`, composes `name` from the parts via `composeName` (`lib/person-name.ts`), defaults country to `"TH"`, writes an audit row (`ATHLETE_*`), and calls `revalidatePath`. **Delete is a soft delete** (`deletedAt` set; the row is kept so historical results still resolve).

## Affiliation

Backed by the Prisma `Affiliation` model:

```typescript
Affiliation {
  id: string;
  name: string;
  country: string;       // default "TH"
  province?; note?;
  headJudgeId?: string;  // head of the affiliation is a Judge (AffiliationHead relation)
  joinedAt?: DateTime;
  // standard audit/soft-delete columns
}
```

Form: [affiliation-form.tsx](../../components/affiliations/affiliation-form.tsx). List: [affiliations-list.tsx](../../components/affiliations/affiliations-list.tsx).

Writes go through [app/actions/affiliations.ts](../../app/actions/affiliations.ts): `createAffiliation`, `updateAffiliation`, `deleteAffiliation` — same pattern (permission gate on the `affiliations` resource, audit log, `revalidatePath`, soft-delete on delete).

## CSV bulk import

For large competitions, Athletes and Affiliations can be bulk-imported from CSV via [app/actions/csv-import.ts](../../app/actions/csv-import.ts) (`previewAthleteImport` / `commitAthleteImport`, `previewAffiliationImport` / `commitAffiliationImport`). Import is **Root-Admin-only** (`requireRoot`), two-phase (preview returns per-row create/update/error verdicts without writing; commit re-validates and writes all-or-nothing in one `$transaction`), and capped at `MAX_ROWS = 5000` / `MAX_BYTES = 5 MB`. FKs resolve by `*_id` first, then by exact live name. Reverse direction: each list also exports to CSV via `app/api/admin/export/athletes` and `app/api/admin/export/affiliations`.

## Pages

- [Athletes list / new / edit](../pages/admin/athletes.md)
- [Affiliations list / new / edit](../pages/admin/affiliations.md)

## TODOs before production

- BIB uniqueness is enforced per event (`@@unique([eventId, bib])`); a cross-season / cross-event uniqueness policy is still undecided.
- Photo / portrait field for the scoreboard.

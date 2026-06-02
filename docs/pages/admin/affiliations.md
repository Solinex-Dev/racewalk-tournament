# Admin · Affiliations (List / New / Edit)

**Routes**:
- `/admin/affiliations`
- `/admin/affiliations/new`
- `/admin/affiliations/[affiliationId]`

**Role**: [admin](../../personas/admin.md)
**Type**: Server pages, Client `AffiliationForm`
**Code**:
- [app/admin/(pages)/affiliations/page.tsx](../../../app/admin/(pages)/affiliations/page.tsx)
- [app/admin/(pages)/affiliations/new/page.tsx](../../../app/admin/(pages)/affiliations/new/page.tsx)
- [app/admin/(pages)/affiliations/[affiliationId]/page.tsx](../../../app/admin/(pages)/affiliations/[affiliationId]/page.tsx)
- [components/affiliations/affiliation-form.tsx](../../../components/affiliations/affiliation-form.tsx)

## Purpose

CRUD for clubs / schools / organizations that athletes represent.

## Features Surfaced

- [athlete-affiliation-mgmt](../../features/athlete-affiliation-mgmt.md) (primary)

## TODOs

- Decide deletion behavior when athletes still reference the affiliation
- Logo upload (for scoreboard display)

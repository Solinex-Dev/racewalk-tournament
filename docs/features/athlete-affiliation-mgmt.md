# Athlete & Affiliation Management

**Status**: UI only (mock data)
**Roles**: [admin](../personas/admin.md)
**Routes**:
- `/admin/athletes`, `/admin/athletes/new`, `/admin/athletes/[athleteId]`
- `/admin/affiliations`, `/admin/affiliations/new`, `/admin/affiliations/[affiliationId]`
**Entities**: Athlete, Affiliation
**Related features**: [round-configuration](round-configuration.md) (athletes assigned to rounds)

## Overview

CRUD for the two reference entities that get assigned into rounds:

- **Athlete** — the competitor (name, bib, country, affiliation reference)
- **Affiliation** — the club/school/organization an athlete represents

Both live outside any specific event so they can be reused across events and seasons.

## Athlete

```typescript
Athlete {
  id, name, bib, country, affiliation, ...
}
```

Form: [athlete-form.tsx](../../components/athletes/athlete-form.tsx). List: [athletes-list.tsx](../../components/athletes/athletes-list.tsx).

## Affiliation

```typescript
Affiliation {
  id, name, ...
}
```

Form: [affiliation-form.tsx](../../components/affiliations/affiliation-form.tsx). List: [affiliations-list.tsx](../../components/affiliations/affiliations-list.tsx).

## Pages

- [Athletes list / new / edit](../pages/admin/athletes.md)
- [Affiliations list / new / edit](../pages/admin/affiliations.md)

## TODOs before production

- Bib number uniqueness rules (unique across event? across season?)
- Affiliation deletion: what happens to athletes that reference it?
- Athlete import (CSV upload) for large competitions
- Photo / portrait field for the scoreboard?

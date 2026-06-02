# Judge Management

**Status**: UI only (mock data)
**Roles**: [admin](../personas/admin.md)
**Routes**: `/admin/judges`, `/admin/judges/new`, `/admin/judges/[judgeId]`
**Entities**: Judge
**Related features**: [round-configuration](round-configuration.md) (judges assigned to rounds with positions)

## Overview

CRUD for the **pool of officials** available to assign into rounds. A record here represents a person who can serve as a judge, head judge, event logger, or timekeeper — the specific position is chosen when the person is assigned to a round.

## Judge entity

```typescript
Judge {
  id, name, ...
}
```

Form: [judge-form.tsx](../../components/judges/judge-form.tsx). List: [judges-list.tsx](../../components/judges/judges-list.tsx).

A judge record does **not** carry a fixed position. Position is per-round; see [round-configuration](round-configuration.md).

## Pages

- [Judges list / new / edit](../pages/admin/judges.md)

## TODOs before production

- Certification tracking (federation-issued judging levels)?
- Availability calendar to prevent double-booking across rounds
- Contact info (phone, email) for last-minute coordination
- Photo for visual identification at venue

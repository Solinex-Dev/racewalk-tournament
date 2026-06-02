# Admin Management

**Status**: UI only (mock data)
**Roles**: [admin](../personas/admin.md) (owner-level only)
**Routes**: `/admin/admins`, `/admin/admins/new`, `/admin/admins/[adminId]`
**Entities**: Admin
**Related features**: none (self-management)

## Overview

Manages the **admin user accounts** themselves. Only the owner-level admin should have access to this feature (no UI permission gate exists today).

## Admin entity

```typescript
Admin {
  id: string;
  name: string;
  role: string;       // e.g. "owner", "event manager", "score officer"
  email: string;
  status: "active" | "inactive";
}
```

Source: `MOCK_ADMINS` in [app/admin/(pages)/admins/page.tsx](../../app/admin/(pages)/admins/page.tsx) — 3 sample admins (owner, event manager, score officer).

## Admin sub-roles (planned)

The `role` field is a free-text string today. It will become a discrete enum to gate features:

| Sub-role | Can do |
|----------|--------|
| `owner` | Everything, including creating/removing other admins |
| `event manager` | Create events, configure rounds, generate codes |
| `score officer` | View results, export reports |

The exact permission matrix is not yet decided — see [decisions/](../decisions/).

## Pages

- [Admins list / new / edit](../pages/admin/admins.md)

## TODOs before production

- Real authentication (password hash, session, MFA)
- Decide the permission model (RBAC vs. flag-based)
- Audit log of admin actions
- Password reset flow

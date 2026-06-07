# Admin Management

**Status**: Implemented
**Roles**: [admin](../personas/admin.md) (`admins` permission; Root Admin for Root-level changes)
**Routes**: `/admin/admins`, `/admin/admins/new`, `/admin/admins/[adminId]`
**Entities**: `User` (role `ADMIN`)
**Code**: [app/actions/admins.ts](../../app/actions/admins.ts), [lib/permissions.ts](../../lib/permissions.ts), [lib/authz.ts](../../lib/authz.ts)
**Related features**: none (self-management)

## Overview

Manages the **admin user accounts** themselves. Access is gated by the `admins` resource permission, with extra **Root Admin** rules for granting/editing/deleting other Roots. Admins are stored as `User` rows with `role: "ADMIN"` (the same `User` model used for auth — see [data-model](../architecture/data-model.md)).

## Admin entity

Backed by the Prisma `User` model (admin-relevant fields):

```typescript
User {
  id: string;
  name?;                 // composed from prefix/firstName/middleName/lastName
  prefix?; firstName?; middleName?; lastName?;
  email?: string;        // unique
  password?: string;     // bcrypt hash
  title?: string;        // free-text display label (e.g. "Event Manager")
  role: "USER" | "ADMIN";
  isRoot: boolean;       // bypasses every fine-grained permission check
  permissions: Json;     // resource × action matrix
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  // lifecycle: suspendedAt?, deleteAfter?, deletedAt?  + audit columns
}
```

The list page (`/admin/admins`) is a Server Component reading `prisma.user.findMany` for `role: "ADMIN"`. It deliberately hides the viewer themselves and every Root Admin.

## Permission model (implemented)

Permissions are a **fine-grained matrix** of resource × action booleans, defined in [lib/permissions.ts](../../lib/permissions.ts) — not a single sub-role string. A **Root Admin** (`isRoot`) bypasses every check.

- **Resources**: `events`, `moderator`, `athletes`, `judges`, `affiliations`, `admins`, `reports`.
- **Actions**: `view`, `create`, `edit`, `delete` — except `moderator` and `reports`, which are **view-only** (access flags).
- The `title` field is a free-text display label (e.g. "Event Manager", "Score Officer") and is independent of the permission matrix.

Server-side enforcement is in [lib/authz.ts](../../lib/authz.ts): `getCurrentAdmin()` re-reads the user from the DB on every call (fresh permissions, no stale JWT) and returns null unless `role === "ADMIN"` and `status === "ACTIVE"`; `requirePermission(resource, action)` throws a Thai error unless the matrix (or `isRoot`) allows it. Every mutating Server Action calls it.

## Writes

Admin CRUD goes through the **Server Actions** in [app/actions/admins.ts](../../app/actions/admins.ts): `createAdmin`, `updateAdmin`, `deleteAdmin`. Each requires `requirePermission("admins", …)`, validates email/password (`lib/validation.ts`), bcrypt-hashes new passwords, composes `name`, writes an audit row (`ADMIN_*`), and `revalidatePath`s.

**Root-admin invariants** are enforced here:

- Only a Root may grant or change the `isRoot` flag, or edit/delete a Root Admin.
- The system must always keep **at least one Root** — `countOtherRoots` blocks the last Root from being demoted or deleted.
- `deleteAdmin` sets `status: "DELETED"` + `deletedAt` (not a hard delete).

## Pages

- [Admins list / new / edit](../pages/admin/admins.md)

## TODOs before production

- MFA for admin login (password hashing + sessions are already implemented — see [state-and-data-flow](../architecture/state-and-data-flow.md)).
- Self-service password reset / forgot-password flow (admins can change their own password today via [app/actions/profile.ts](../../app/actions/profile.ts), but there is no reset-by-email flow).

# Admin · Admins (List / New / Edit)

**Status**: Implemented (Prisma-backed, permission-gated)

**Routes**:
- `/admin/admins`
- `/admin/admins/new`
- `/admin/admins/[adminId]`

**Role**: [admin](../../personas/admin.md) (gated by the `admins` permission resource; Root Admin bypasses all checks)
**Type**: Server pages, Client `AdminForm`
**Code**:
- [app/admin/(pages)/admins/page.tsx](../../../app/admin/(pages)/admins/page.tsx)
- [app/admin/(pages)/admins/new/page.tsx](../../../app/admin/(pages)/admins/new/page.tsx)
- [app/admin/(pages)/admins/[adminId]/page.tsx](../../../app/admin/(pages)/admins/[adminId]/page.tsx)
- [components/admins/admin-form.tsx](../../../components/admins/admin-form.tsx)
- [components/admins/admins-list.tsx](../../../components/admins/admins-list.tsx)
- [app/actions/admins.ts](../../../app/actions/admins.ts) (Server Actions)
- [lib/authz.ts](../../../lib/authz.ts), [lib/permissions.ts](../../../lib/permissions.ts)

## Purpose

Manage admin accounts (rows in the `User` table with `role: ADMIN`). Lists all admins; create / edit / suspend / delete with a per-resource permission matrix.

## Access Control

Every page resolves the current admin via `getCurrentAdmin()` ([lib/authz.ts](../../../lib/authz.ts)) — which re-reads the user from the DB so permission changes take effect immediately — and renders `<NoAccess />` unless the viewer can access the `admins` resource. The "+ เพิ่ม Admin ใหม่" button, the Edit/Delete buttons, and the Root toggle are each shown only when the matching `view` / `create` / `edit` / `delete` permission (or `isRoot`) is granted.

The list query deliberately **excludes the viewer themselves and any Root Admin** (`isRoot: false`, `id != me.id`, `status != DELETED`); the viewer manages their own account in `/admin/settings`, and Root Admins are hidden from non-Root admins.

## UI Sections

**List** ([admins-list.tsx](../../../components/admins/admins-list.tsx)): client-side search (name / email / role), role + status filters, and pagination (10 per page). Columns: name, email, role label (`title`), status badge (active / inactive), and a view/edit action.

**Form** ([admin-form.tsx](../../../components/admins/admin-form.tsx)): person name fields, email, `title` (free-text display label such as "Owner", "Event Manager"), password (required on create, optional on edit — leave blank to keep), status (`ACTIVE` / `SUSPENDED`), and a **permissions matrix** of `RESOURCES × ACTIONS` (view / create / edit / delete). A Root Admin checkbox (visible only to a Root viewer) grants full access and hides the matrix.

## Data Displayed

Source: live Prisma query in the Server Component (`prisma.user.findMany`). The detail page also renders audit info (`createdBy` / `updatedBy` / timestamps) via `resolveAudit`.

## Actions

Writes are Server Actions in [app/actions/admins.ts](../../../app/actions/admins.ts), each guarded by `requirePermission("admins", …)` and logged through `logCurrentAdmin`:

- `createAdmin` — validates email + password length, hashes the password with `bcrypt`, stores the permission matrix; only a Root viewer may grant Root.
- `updateAdmin` — same validation; password optional; non-Root admins cannot edit a Root Admin; the system refuses to drop below one Root (`countOtherRoots`).
- `deleteAdmin` — soft-delete: sets `status: DELETED` + `deletedAt` (not a hard row delete); refuses to delete the last Root.

Each action calls `revalidatePath("/admin/admins")` (and the detail path on edit) so the list reflects the change. The client form then `router.refresh()`es or navigates back to the list.

## Features Surfaced

- [admin-mgmt](../../features/admin-mgmt.md) (primary)

## TODOs

- Password reset / invitation flow (admins are created with a password set by the creator)
- Restore flow for soft-deleted admins

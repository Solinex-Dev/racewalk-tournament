# Admin · Admins (List / New / Edit)

**Routes**:
- `/admin/admins`
- `/admin/admins/new`
- `/admin/admins/[adminId]`

**Role**: [admin](../../personas/admin.md) (owner-level only — gate not yet enforced)
**Type**: Server pages, Client `AdminForm`
**Code**:
- [app/admin/(pages)/admins/page.tsx](../../../app/admin/(pages)/admins/page.tsx)
- [app/admin/(pages)/admins/new/page.tsx](../../../app/admin/(pages)/admins/new/page.tsx)
- [app/admin/(pages)/admins/[adminId]/page.tsx](../../../app/admin/(pages)/admins/[adminId]/page.tsx)
- [components/admins/admin-form.tsx](../../../components/admins/admin-form.tsx)

## Purpose

Manage admin accounts. Lists all admins; create / edit / deactivate.

## UI Sections

**List**: name, role, email, status badge.

**Form**: name, role, email, status (`active` / `inactive`).

## Data Displayed

Source: `MOCK_ADMINS` — 3 sample admins (owner, event manager, score officer).

## Features Surfaced

- [admin-mgmt](../../features/admin-mgmt.md) (primary)

## TODOs

- Password reset / invitation flow
- Hard permission gate (only owner can edit)
- Audit log of changes

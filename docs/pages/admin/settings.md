# Admin · Settings

**Route**: `/admin/settings`
**Role**: [admin](../../personas/admin.md)
**Type**: Server Component wrapping Client `ProfileForm`
**Status**: Implemented
**Code**:
- [app/admin/(pages)/settings/page.tsx](../../../app/admin/(pages)/settings/page.tsx)
- [components/admins/profile-form.tsx](../../../components/admins/profile-form.tsx)
- [app/actions/profile.ts](../../../app/actions/profile.ts) (write path)

## Purpose

The signed-in admin's own account settings: edit their display profile and change their password. This is **per-user self-service**, not system-wide configuration.

## UI Sections

1. Page header with breadcrumb
2. **Profile form** (`ProfileForm`):
   - Name parts (prefix / first / middle / last)
   - Email
   - Title (free-text display label)
3. **Password section** — change password (current + new; new must be ≥8 chars and differ from the current one)

## Data Displayed

The Server Component reads the current session (`getServerSession(authOptions)`), redirects non-admins to `/admin/login`, then loads the user's own name parts, email, and title from Prisma. `export const dynamic = "force-dynamic"` keeps it uncached per request.

## Actions

- Save profile → `updateMyProfile(draft)` (`app/actions/profile.ts`), scoped to the caller's own admin session
- Change password → `changeMyPassword(currentPassword, newPassword)`; verifies the current password (bcrypt) and enforces the length/no-reuse rule
- Both surface success/error via `sonner` toasts

## Features Surfaced

None directly. Manages the admin's own account; account-level admin management of *other* users lives under `/admin/admins`.

## TODOs

- (none outstanding — system-wide settings such as language/theme/report-layout are not configurable; theme is fixed to light, see [architecture/overview.md](../../architecture/overview.md))

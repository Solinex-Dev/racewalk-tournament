# Admin · Login

**Route**: `/admin/login` (in route group `(auth)`)
**Role**: [admin](../../personas/admin.md)
**Type**: Server page wrapping Client form
**Code**:
- [app/admin/(auth)/login/page.tsx](../../../app/admin/(auth)/login/page.tsx)
- [app/admin/(auth)/login/layout.tsx](../../../app/admin/(auth)/login/layout.tsx)
- [components/auth/admin-login-form.tsx](../../../components/auth/admin-login-form.tsx)

## Purpose

Username/password entry point for admins. Auth route group bypasses the sidebar layout.

## UI Sections

1. Brand block (logo, app name)
2. Login form: username, password, submit
3. Info text

## Data Displayed

Static.

## Actions

- Submit form → mock validation → `router.push("/admin")`
- No API call, no error path yet

## Features Surfaced

- [admin-mgmt](../../features/admin-mgmt.md) (login is the entry to this)

## TODOs

- Real auth (password hash, session cookie, MFA)
- Error messaging (wrong credentials)
- "Forgot password" flow
- Lockout on repeated failures

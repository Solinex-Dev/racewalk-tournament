# Admin · Login

**Status**: Implemented (NextAuth credentials + JWT session)

**Route**: `/admin/login` (in route group `(auth)`)
**Role**: [admin](../../personas/admin.md)
**Type**: Server page wrapping Client form
**Code**:
- [app/admin/(auth)/login/page.tsx](../../../app/admin/(auth)/login/page.tsx)
- [app/admin/(auth)/login/layout.tsx](../../../app/admin/(auth)/login/layout.tsx)
- [components/auth/admin-login-form.tsx](../../../components/auth/admin-login-form.tsx)
- [auth.ts](../../../auth.ts) (NextAuth config), [proxy.ts](../../../proxy.ts) (middleware)

## Purpose

Email/password entry point for admins. The `(auth)` route group bypasses the sidebar layout (`layout.tsx` renders a bare slate-50 shell).

## Flow

The Server page calls `getServerSession(authOptions)`; if the visitor is already an admin (`isAdminSession`), it `redirect`s to a safe admin target (`getSafeAdminRedirect(callbackUrl)`) instead of showing the form. The middleware ([proxy.ts](../../../proxy.ts)) enforces the mirror of this: unauthenticated requests to `/admin/*` are redirected here with `?callbackUrl=` preserved.

## UI Sections

1. Brand block (logo, app name)
2. Login form: email, password, submit
3. Info text
4. Dev-only "Quick login" (rendered only when `APP_ENV === "development"`)

## Data Displayed

Static, plus an inline error message on failed login.

## Actions

- Submit → `signIn("credentials", { email, password, rememberMe: "true", redirect: false })` (NextAuth, [components/auth/admin-login-form.tsx](../../../components/auth/admin-login-form.tsx))
- On success → navigate to the `callbackUrl` (if same-origin) or `/admin`
- On failure → show "อีเมลหรือรหัสผ่านไม่ถูกต้อง"

Authentication is handled by NextAuth's `CredentialsProvider` in [auth.ts](../../../auth.ts): the password is `bcrypt`-compared, and login is **blocked for non-ACTIVE users** (`resolveUserStatus` — SUSPENDED is rejected, DELETED triggers `finalizeDeletion`). On success a `sessionId` is minted and a `UserSession` row is created (with IP / user-agent / `rememberMe` / `expiresAt`); a `USER_LOGGED_IN` activity log is fired. Sessions use the JWT strategy and can be revoked server-side (the JWT callback rejects revoked `sessionId`s).

## Features Surfaced

- [admin-mgmt](../../features/admin-mgmt.md) (login is the entry to this)

## TODOs

- "Forgot password" flow
- Login rate-limiting / lockout on repeated failures (the official secret-code join is rate-limited, but admin login is not yet)

/**
 * Next.js 16 proxy — route protection.
 * Uses getToken (JWT from cookie) — getServerSession does not work reliably here.
 *
 * Racewalk routes:
 * - /admin/*          → requires ADMIN role
 * - /admin/login      → redirects authenticated admins to /admin (or callbackUrl)
 * - everything else   → public (in-event role pages use their own secret-code gate)
 */
import { NextResponse } from "next/server";
import type { NextRequest, NextResponse as NextResponseType } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getSafeAdminRedirect,
  isAdminSession,
} from "@/lib/admin-auth-redirect";
import {
  OFFICIAL_COOKIE_NAME,
  OFFICIAL_COOKIE_TTL_SECONDS,
  signOfficialSession,
  verifyOfficialSession,
} from "@/lib/official-jwt";

const adminPathPrefix = "/admin";
const adminLoginPath = "/admin/login";

const authEntryPaths = [adminLoginPath] as const;

// Race-day workspace routes whose official cookie should slide (renew) on every request.
const officialPathPrefixes = ["/judge", "/head-judge", "/event-logger"];

function isAuthEntryPath(pathname: string): boolean {
  return authEntryPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === adminPathPrefix || pathname.startsWith(adminPathPrefix + "/");
}

function isOfficialPath(pathname: string): boolean {
  return officialPathPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Sliding session: if a valid official cookie is present on a race-day route,
 * re-issue it with a fresh expiry on the response. Because every workspace polls
 * (AutoRefresh) every 5–15s, the session stays alive for the whole event as long
 * as the tab is open — and only truly expires after 12h of total inactivity.
 */
async function slideOfficialSession(
  request: NextRequest,
  response: NextResponseType,
): Promise<void> {
  const token = request.cookies.get(OFFICIAL_COOKIE_NAME)?.value;
  if (!token) return;
  const payload = await verifyOfficialSession(token);
  if (!payload) return;
  const fresh = await signOfficialSession(payload);
  response.cookies.set({
    name: OFFICIAL_COOKIE_NAME,
    value: fresh,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OFFICIAL_COOKIE_TTL_SECONDS,
  });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Keep race-day officials signed in for the whole event (sliding session).
  if (isOfficialPath(pathname)) {
    const res = NextResponse.next();
    await slideOfficialSession(request, res);
    return res;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = token?.role as string | undefined;
  const userId = token?.id ?? token?.sub;
  const isAdmin = isAdminSession(role, userId);

  if (isAuthEntryPath(pathname)) {
    if (isAdmin) {
      const callback = request.nextUrl.searchParams.get("callbackUrl");
      const targetPath = getSafeAdminRedirect(callback);
      return NextResponse.redirect(new URL(targetPath, request.url));
    }
    return NextResponse.next();
  }

  if (isAdminPath(pathname)) {
    if (isAdmin) {
      return NextResponse.next();
    }
    const signInUrl = new URL(adminLoginPath, request.url);
    signInUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|ico|svg|webp)$).*)"],
};

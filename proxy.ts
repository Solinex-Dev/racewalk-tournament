/**
 * Next.js 16 proxy — route protection.
 * Uses getServerSession (database/JWT-aware) rather than withAuth (JWT-only).
 *
 * Racewalk routes:
 * - /admin/*          → requires ADMIN role
 * - /admin/login      → unauthenticated entry (redirects logged-in users to /admin)
 * - everything else   → public (in-event role pages use their own secret-code gate)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const adminPathPrefix = "/admin";
const adminLoginPath = "/admin/login";

const authEntryPaths = [adminLoginPath] as const;

function isAuthEntryPath(pathname: string): boolean {
  return authEntryPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function getSafePostAuthRedirect(
  request: NextRequest,
  rawCallback: string | null,
  fallbackPath: string
): URL {
  if (!rawCallback) {
    return new URL(fallbackPath, request.url);
  }
  const trimmed = rawCallback.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return new URL(fallbackPath, request.url);
  }
  let resolved: URL;
  try {
    resolved = new URL(trimmed, request.url);
  } catch {
    return new URL(fallbackPath, request.url);
  }
  if (resolved.origin !== request.nextUrl.origin) {
    return new URL(fallbackPath, request.url);
  }
  if (
    authEntryPaths.some(
      (p) =>
        resolved.pathname === p || resolved.pathname.startsWith(`${p}/`)
    )
  ) {
    return new URL(fallbackPath, request.url);
  }
  return resolved;
}

function isAdminPath(pathname: string): boolean {
  return pathname === adminPathPrefix || pathname.startsWith(adminPathPrefix + "/");
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Logged-in users visiting the login page get bounced to /admin (or a safe callbackUrl)
  if (isAuthEntryPath(pathname)) {
    const session = await getServerSession(authOptions);
    if (session) {
      const callback = request.nextUrl.searchParams.get("callbackUrl");
      const target = getSafePostAuthRedirect(request, callback, "/admin");
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  // Admin pages require an ADMIN session; everything else is public
  if (isAdminPath(pathname)) {
    const session = await getServerSession(authOptions);
    if (!session) {
      const signInUrl = new URL(adminLoginPath, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }
    const role = (session.user as { role?: string })?.role;
    if (role !== "ADMIN") {
      const signInUrl = new URL(adminLoginPath, request.url);
      signInUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|ico|svg|webp)$).*)"],
};

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
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getSafeAdminRedirect,
  isAdminSession,
} from "@/lib/admin-auth-redirect";

const adminPathPrefix = "/admin";
const adminLoginPath = "/admin/login";

const authEntryPaths = [adminLoginPath] as const;

function isAuthEntryPath(pathname: string): boolean {
  return authEntryPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === adminPathPrefix || pathname.startsWith(adminPathPrefix + "/");
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = token?.role as string | undefined;
  const userId = (token?.id ?? token?.sub) as string | undefined;
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

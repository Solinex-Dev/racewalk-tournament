/**
 * Cookie-based session helpers for non-admin race-day roles
 * (Judge, Head Judge, Event Logger, Timekeeper).
 *
 * The JWT sign/verify primitives live in lib/official-jwt.ts (edge-safe).
 * This module adds the next/headers cookie read/write layer — usable only
 * in Server Components / Server Actions (NOT middleware).
 */
import { cookies } from "next/headers";
import {
  OFFICIAL_COOKIE_NAME,
  OFFICIAL_COOKIE_TTL_SECONDS,
  signOfficialSession,
  verifyOfficialSession,
  type OfficialSessionPayload,
  type OfficialPosition,
} from "@/lib/official-jwt";

// Re-export the edge-safe primitives so existing imports keep working.
export {
  OFFICIAL_COOKIE_NAME,
  OFFICIAL_COOKIE_TTL_SECONDS,
  signOfficialSession,
  verifyOfficialSession,
  defaultRouteForPosition,
  type OfficialSessionPayload,
  type OfficialPosition,
} from "@/lib/official-jwt";

export async function setOfficialSessionCookie(payload: OfficialSessionPayload): Promise<void> {
  const token = await signOfficialSession(payload);
  const cookieStore = await cookies();
  cookieStore.set({
    name: OFFICIAL_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OFFICIAL_COOKIE_TTL_SECONDS,
  });
}

export async function clearOfficialSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OFFICIAL_COOKIE_NAME);
}

export async function getOfficialSession(): Promise<OfficialSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OFFICIAL_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyOfficialSession(token);
}

export async function requireOfficialSession(
  requiredPositions?: OfficialPosition[],
): Promise<OfficialSessionPayload> {
  const session = await getOfficialSession();
  if (!session) throw new Error("ไม่มี session กรรมการ");
  if (requiredPositions && !requiredPositions.includes(session.position)) {
    throw new Error(`ตำแหน่งไม่ถูกต้อง (ต้องเป็น ${requiredPositions.join(" หรือ ")})`);
  }
  return session;
}

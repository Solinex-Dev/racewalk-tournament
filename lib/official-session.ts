/**
 * Signed JWT cookie session for non-admin race-day roles
 * (Judge, Head Judge, Event Logger, Timekeeper).
 *
 * Uses NEXTAUTH_SECRET as the signing key so we don't need a separate env.
 * Cookie lifetime defaults to 12 hours (one event day).
 */
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const OFFICIAL_COOKIE_NAME = "rw_official_session";
const COOKIE_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export type OfficialPosition = "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER" | "TIMEKEEPER";

export type OfficialSessionPayload = {
  officialId: string; // RoundOfficial.id
  judgeId: string;
  judgeName: string;
  roundId: string;
  eventId: string;
  position: OfficialPosition;
  zone: string | null;
};

function getKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signOfficialSession(payload: OfficialSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifyOfficialSession(
  token: string,
): Promise<OfficialSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    if (
      typeof payload.officialId === "string" &&
      typeof payload.judgeId === "string" &&
      typeof payload.judgeName === "string" &&
      typeof payload.roundId === "string" &&
      typeof payload.eventId === "string" &&
      typeof payload.position === "string"
    ) {
      return {
        officialId: payload.officialId,
        judgeId: payload.judgeId,
        judgeName: payload.judgeName,
        roundId: payload.roundId,
        eventId: payload.eventId,
        position: payload.position as OfficialPosition,
        zone: (payload.zone as string | null) ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

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
    maxAge: COOKIE_TTL_SECONDS,
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

export function defaultRouteForPosition(position: OfficialPosition, eventId: string): string {
  switch (position) {
    case "HEAD_JUDGE":
      return `/head-judge/events/${eventId}`;
    case "EVENT_LOGGER":
      return `/event-logger/events/${eventId}`;
    case "TIMEKEEPER":
      return `/timekeeper/events/${eventId}`;
    case "JUDGE":
    default:
      return `/judge/events/${eventId}`;
  }
}

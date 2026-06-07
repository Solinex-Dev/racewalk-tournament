/**
 * Edge-safe JWT sign/verify for non-admin race-day roles.
 *
 * Pure jose — NO next/headers import — so it can run in middleware/edge
 * (the sliding-session refresh in proxy.ts) as well as in Server Actions.
 * Cookie read/write helpers live in lib/official-session.ts.
 */
import { SignJWT, jwtVerify } from "jose";

export const OFFICIAL_COOKIE_NAME = "rw_official_session";
export const OFFICIAL_COOKIE_TTL_SECONDS = 60 * 60 * 12; // 12 hours of inactivity buffer

export type OfficialPosition = "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER";

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
    .setExpirationTime(`${OFFICIAL_COOKIE_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifyOfficialSession(
  token: string,
): Promise<OfficialSessionPayload | null> {
  return (await verifyOfficialSessionWithExp(token))?.payload ?? null;
}

/**
 * Like verifyOfficialSession but also returns the JWT `exp` (Unix seconds) so
 * callers can decide whether the cookie is close enough to expiry to re-sign.
 * Used by the sliding-session refresh in proxy.ts to avoid an HMAC sign on
 * every single request.
 */
export async function verifyOfficialSessionWithExp(
  token: string,
): Promise<{ payload: OfficialSessionPayload; exp: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    if (
      typeof payload.officialId === "string" &&
      typeof payload.judgeId === "string" &&
      typeof payload.judgeName === "string" &&
      typeof payload.roundId === "string" &&
      typeof payload.eventId === "string" &&
      typeof payload.position === "string" &&
      typeof payload.exp === "number"
    ) {
      return {
        payload: {
          officialId: payload.officialId,
          judgeId: payload.judgeId,
          judgeName: payload.judgeName,
          roundId: payload.roundId,
          eventId: payload.eventId,
          position: payload.position as OfficialPosition,
          zone: (payload.zone as string | null) ?? null,
        },
        exp: payload.exp,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function defaultRouteForPosition(position: OfficialPosition, eventId: string): string {
  switch (position) {
    case "HEAD_JUDGE":
      return `/head-judge/events/${eventId}`;
    case "EVENT_LOGGER":
      return `/event-logger/events/${eventId}`;
    case "JUDGE":
    default:
      return `/judge/events/${eventId}`;
  }
}

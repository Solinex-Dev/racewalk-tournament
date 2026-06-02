"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  setOfficialSessionCookie,
  clearOfficialSessionCookie,
  defaultRouteForPosition,
} from "@/lib/official-session";
import { checkRateLimit, maybePruneRateLimit } from "@/lib/rate-limit";

// Max 10 join attempts per IP per minute — prevents brute-force on 6-char codes
const JOIN_MAX_ATTEMPTS = 10;
const JOIN_WINDOW_MS = 60_000;

export type JoinResult = {
  ok: true;
  redirect: string;
} | {
  ok: false;
  error: string;
};

export async function joinAsOfficial(
  eventId: string,
  secretCode: string,
): Promise<JoinResult> {
  // Rate limit by client IP (falls back to "unknown" → shared bucket for proxies that hide IP)
  maybePruneRateLimit(JOIN_WINDOW_MS);
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  if (!checkRateLimit(`join:${ip}:${eventId}`, JOIN_MAX_ATTEMPTS, JOIN_WINDOW_MS)) {
    return { ok: false, error: "พยายามมากเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง" };
  }

  const code = secretCode.trim().toUpperCase();
  if (code.length !== 6) {
    return { ok: false, error: "รหัสลับต้องมี 6 ตัวอักษร" };
  }

  // Find RoundOfficial whose secretCode matches and whose round belongs to this event
  const official = await prisma.roundOfficial.findFirst({
    where: {
      secretCode: code,
      deletedAt: null,
      round: { eventId, deletedAt: null },
    },
    include: {
      round: { select: { id: true, eventId: true, status: true, name: true } },
      judge: { select: { id: true, name: true } },
    },
  });

  if (!official) {
    return { ok: false, error: "รหัสลับไม่ถูกต้องสำหรับ Event นี้" };
  }

  if (official.round.status === "FINISHED") {
    return { ok: false, error: "รอบที่ใช้รหัสนี้จบการแข่งขันแล้ว" };
  }

  await setOfficialSessionCookie({
    officialId: official.id,
    judgeId: official.judgeId,
    judgeName: official.judge.name,
    roundId: official.roundId,
    eventId: official.round.eventId,
    position: official.position,
    zone: official.zone,
  });

  return {
    ok: true,
    redirect: defaultRouteForPosition(official.position, eventId),
  };
}

export async function logoutOfficial(): Promise<void> {
  await clearOfficialSessionCookie();
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOfficialSession } from "@/lib/official-session";

const RED_CARDS_TO_DQ = 4;

export type CardSymbol = "LIFTED_FOOT" | "BENT_KNEE";

/**
 * Issue a YELLOW card (note). Max 2 per judge per athlete per round.
 * Yellow cards are immediate (no head-judge confirmation).
 */
export async function issueYellowCard(athleteId: string, symbol: CardSymbol) {
  const session = await requireOfficialSession(["JUDGE", "HEAD_JUDGE"]);

  // Verify athlete is in this round
  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId: session.roundId, athleteId, deletedAt: null },
  });
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");

  // Count existing yellow from this judge to this athlete
  const existing = await prisma.card.count({
    where: {
      roundId: session.roundId,
      athleteId,
      judgeId: session.judgeId,
      color: "YELLOW",
      deletedAt: null,
    },
  });
  if (existing >= 2) {
    throw new Error("ให้ใบเหลืองครบ 2 ใบสำหรับนักกีฬาคนนี้แล้ว");
  }

  await prisma.card.create({
    data: {
      roundId: session.roundId,
      athleteId,
      judgeId: session.judgeId,
      color: "YELLOW",
      symbol,
    },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId: session.roundId,
      actorId: session.judgeId,
      actorName: session.judgeName,
      actorRole: "JUDGE",
      actionType: "yellow_card",
      targetAthleteId: athleteId,
      targetBib: ra.bib,
      details: symbol === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ",
    },
  });

  revalidatePath(`/judge/events/${session.eventId}`);
  revalidatePath(`/head-judge/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}/moderator`);
  return { ok: true };
}

/**
 * Issue a RED card. Max 1 per judge per athlete per round.
 * Red cards start in state=PENDING and require head-judge confirmation.
 */
export async function issueRedCard(athleteId: string, symbol: CardSymbol) {
  const session = await requireOfficialSession(["JUDGE", "HEAD_JUDGE"]);

  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId: session.roundId, athleteId, deletedAt: null },
  });
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");

  const existing = await prisma.card.count({
    where: {
      roundId: session.roundId,
      athleteId,
      judgeId: session.judgeId,
      color: "RED",
      deletedAt: null,
      state: { not: "OVERRIDDEN" },
    },
  });
  if (existing >= 1) {
    throw new Error("ได้ออกใบแดงให้นักกีฬาคนนี้แล้ว");
  }

  await prisma.card.create({
    data: {
      roundId: session.roundId,
      athleteId,
      judgeId: session.judgeId,
      color: "RED",
      symbol,
      state: "PENDING",
    },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId: session.roundId,
      actorId: session.judgeId,
      actorName: session.judgeName,
      actorRole: "JUDGE",
      actionType: "red_card",
      targetAthleteId: athleteId,
      targetBib: ra.bib,
      details: symbol === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ",
      canOverride: true,
    },
  });

  revalidatePath(`/judge/events/${session.eventId}`);
  revalidatePath(`/head-judge/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}/moderator`);
  return { ok: true };
}

/**
 * Head Judge confirms a pending red card. Sets state=CONFIRMED.
 * If athlete now has >=4 confirmed red cards, mark them DQ.
 */
export async function confirmRedCard(cardId: string) {
  const session = await requireOfficialSession(["HEAD_JUDGE"]);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { athlete: { select: { name: true } } },
  });
  if (!card) throw new Error("ไม่พบใบแดงที่ระบุ");
  if (card.roundId !== session.roundId) throw new Error("ใบแดงไม่อยู่ในรอบของคุณ");
  if (card.color !== "RED" || card.state !== "PENDING") {
    throw new Error("ใบนี้ไม่อยู่ในสถานะรอยืนยัน");
  }

  await prisma.card.update({
    where: { id: cardId },
    data: {
      state: "CONFIRMED",
      decidedBy: session.judgeId,
      decidedAt: new Date(),
    },
  });

  // Check DQ threshold
  const confirmedRedCount = await prisma.card.count({
    where: {
      roundId: card.roundId,
      athleteId: card.athleteId,
      color: "RED",
      state: "CONFIRMED",
      deletedAt: null,
    },
  });

  if (confirmedRedCount >= RED_CARDS_TO_DQ) {
    await prisma.roundAthlete.updateMany({
      where: { roundId: card.roundId, athleteId: card.athleteId },
      data: { status: "DQ" },
    });
    await prisma.roundActivityLog.create({
      data: {
        roundId: card.roundId,
        actorId: session.judgeId,
        actorName: session.judgeName,
        actorRole: "HEAD_JUDGE",
        actionType: "athlete_dq",
        targetAthleteId: card.athleteId,
        details: `DQ - ครบใบแดง ${RED_CARDS_TO_DQ} ใบ`,
      },
    });
  }

  await prisma.roundActivityLog.create({
    data: {
      roundId: card.roundId,
      actorId: session.judgeId,
      actorName: session.judgeName,
      actorRole: "HEAD_JUDGE",
      actionType: "red_card_confirm",
      targetAthleteId: card.athleteId,
      details: `ยืนยันใบแดงให้ ${card.athlete.name}`,
    },
  });

  revalidatePath(`/head-judge/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}/moderator`);
  return { ok: true };
}

/**
 * Head Judge overrides (rejects) a pending red card. Sets state=OVERRIDDEN.
 */
export async function rejectRedCard(cardId: string) {
  const session = await requireOfficialSession(["HEAD_JUDGE"]);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { athlete: { select: { name: true } } },
  });
  if (!card) throw new Error("ไม่พบใบแดงที่ระบุ");
  if (card.roundId !== session.roundId) throw new Error("ใบแดงไม่อยู่ในรอบของคุณ");
  if (card.color !== "RED" || card.state !== "PENDING") {
    throw new Error("ใบนี้ไม่อยู่ในสถานะรอยืนยัน");
  }

  await prisma.card.update({
    where: { id: cardId },
    data: {
      state: "OVERRIDDEN",
      decidedBy: session.judgeId,
      decidedAt: new Date(),
    },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId: card.roundId,
      actorId: session.judgeId,
      actorName: session.judgeName,
      actorRole: "HEAD_JUDGE",
      actionType: "red_card_override",
      targetAthleteId: card.athleteId,
      details: `ยกเลิกใบแดงของ ${card.athlete.name}`,
    },
  });

  revalidatePath(`/head-judge/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}/moderator`);
  return { ok: true };
}

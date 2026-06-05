"use server";

import { prisma } from "@/lib/prisma";
import { requireOfficialSession } from "@/lib/official-session";
import {
  assertAthleteActive,
  assertRoundOngoingForCards,
  assertRoundOpenForReview,
  loadOfficialRound,
} from "@/lib/official-round-guards";
import { revalidateRaceDayViews } from "@/lib/revalidate-race-day";
import { finalizeRoundEnd, racersStillOnField } from "@/lib/round-lifecycle";

const RED_CARDS_TO_DQ = 4;

export type CardSymbol = "LIFTED_FOOT" | "BENT_KNEE";

/**
 * Once an athlete has crossed the finish line they are out of judging range —
 * no further yellow/red cards may be issued. The judge UI hides the controls,
 * but this is the server-side enforcement (defense in depth).
 */
async function assertAthleteNotFinished(roundId: string, athleteId: string) {
  const finished = await prisma.finishTime.findUnique({
    where: { roundId_athleteId: { roundId, athleteId } },
  });
  if (finished) {
    throw new Error("นักกีฬาเข้าเส้นชัยแล้ว — ออกใบไม่ได้");
  }
}

/**
 * Issue a YELLOW card (note). Max 1 per symbol per judge per athlete per round.
 * Yellow cards are immediate (no head-judge confirmation).
 */
export async function issueYellowCard(athleteId: string, symbol: CardSymbol) {
  const session = await requireOfficialSession(["JUDGE", "HEAD_JUDGE"]);
  const round = await loadOfficialRound(session.roundId);
  assertRoundOngoingForCards(round);

  const [ra, ea] = await Promise.all([
    prisma.roundAthlete.findFirst({ where: { roundId: session.roundId, athleteId, deletedAt: null } }),
    prisma.eventAthlete.findFirst({
      where: { eventId: session.eventId, athleteId, deletedAt: null },
      select: { bib: true },
    }),
  ]);
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");
  assertAthleteActive(ra);
  await assertAthleteNotFinished(session.roundId, athleteId);
  const athleteBib = ea?.bib ?? undefined;

  const existingSameSymbol = await prisma.card.count({
    where: {
      roundId: session.roundId,
      athleteId,
      judgeId: session.judgeId,
      color: "YELLOW",
      symbol,
      deletedAt: null,
    },
  });
  if (existingSameSymbol >= 1) {
    throw new Error("ให้ใบเหลืองสัญลักษณ์นี้แก่นักกีฬาคนนี้แล้ว");
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
      targetBib: athleteBib,
      details: symbol === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ",
    },
  });

  revalidateRaceDayViews(session.eventId);
  return { ok: true };
}

/**
 * Issue a RED card. Max 1 per judge per athlete per round.
 * Red cards start in state=PENDING and require head-judge confirmation.
 */
export async function issueRedCard(athleteId: string, symbol: CardSymbol) {
  const session = await requireOfficialSession(["JUDGE", "HEAD_JUDGE"]);
  const round = await loadOfficialRound(session.roundId);
  assertRoundOngoingForCards(round);

  const [ra, ea] = await Promise.all([
    prisma.roundAthlete.findFirst({ where: { roundId: session.roundId, athleteId, deletedAt: null } }),
    prisma.eventAthlete.findFirst({
      where: { eventId: session.eventId, athleteId, deletedAt: null },
      select: { bib: true },
    }),
  ]);
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");
  assertAthleteActive(ra);
  await assertAthleteNotFinished(session.roundId, athleteId);
  const athleteBib = ea?.bib ?? undefined;

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
      targetBib: athleteBib,
      details: symbol === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ",
      canOverride: true,
    },
  });

  revalidateRaceDayViews(session.eventId);
  return { ok: true };
}

/**
 * Head Judge confirms a pending red card. Sets state=CONFIRMED.
 * If athlete now has >=4 confirmed red cards, mark them DQ.
 */
export async function confirmRedCard(
  cardId: string,
): Promise<{ ok: true; alreadyDecided?: boolean }> {
  const session = await requireOfficialSession(["HEAD_JUDGE"]);
  const round = await loadOfficialRound(session.roundId);
  assertRoundOpenForReview(round);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { athlete: { select: { name: true } } },
  });
  if (!card) throw new Error("ไม่พบใบแดงที่ระบุ");
  if (card.roundId !== session.roundId) throw new Error("ใบแดงไม่อยู่ในรอบของคุณ");
  if (card.color !== "RED") throw new Error("ใบนี้ไม่ใช่ใบแดง");

  // Atomic PENDING → CONFIRMED. Only the call that actually flips the state
  // proceeds; a racing double-click updates 0 rows and returns a benign no-op,
  // so the DQ check and activity logs run exactly once (no thrown error, no
  // duplicate DQ). This is what made fast double-taps crash before.
  const transition = await prisma.card.updateMany({
    where: { id: cardId, state: "PENDING", deletedAt: null },
    data: {
      state: "CONFIRMED",
      decidedBy: session.judgeId,
      decidedAt: new Date(),
    },
  });
  if (transition.count === 0) {
    return { ok: true, alreadyDecided: true };
  }

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

  // A DQ can remove the last athlete still on the field. If no one is left racing
  // (everyone has finished or been DQ'd), end the round automatically — same
  // outcome as the last finisher crossing the line.
  if (
    confirmedRedCount >= RED_CARDS_TO_DQ &&
    (await racersStillOnField(card.roundId)) === 0
  ) {
    await finalizeRoundEnd(
      card.roundId,
      { id: "system", name: "ระบบ (อัตโนมัติ)", role: "MODERATOR" },
      "จบการแข่งขันอัตโนมัติ — ไม่มีนักกีฬาเหลือในสนาม",
    );
  }

  revalidateRaceDayViews(session.eventId);
  return { ok: true };
}

/**
 * Head Judge overrides (rejects) a pending red card. Sets state=OVERRIDDEN.
 */
export async function rejectRedCard(
  cardId: string,
): Promise<{ ok: true; alreadyDecided?: boolean }> {
  const session = await requireOfficialSession(["HEAD_JUDGE"]);
  const round = await loadOfficialRound(session.roundId);
  assertRoundOpenForReview(round);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { athlete: { select: { name: true } } },
  });
  if (!card) throw new Error("ไม่พบใบแดงที่ระบุ");
  if (card.roundId !== session.roundId) throw new Error("ใบแดงไม่อยู่ในรอบของคุณ");
  if (card.color !== "RED") throw new Error("ใบนี้ไม่ใช่ใบแดง");

  // Atomic PENDING → OVERRIDDEN (see confirmRedCard for the rationale).
  const transition = await prisma.card.updateMany({
    where: { id: cardId, state: "PENDING", deletedAt: null },
    data: {
      state: "OVERRIDDEN",
      decidedBy: session.judgeId,
      decidedAt: new Date(),
    },
  });
  if (transition.count === 0) {
    return { ok: true, alreadyDecided: true };
  }

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

  revalidateRaceDayViews(session.eventId);
  return { ok: true };
}

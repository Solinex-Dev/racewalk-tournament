"use server";

import { prisma } from "@/lib/prisma";
import { requireOfficialSession } from "@/lib/official-session";
import {
  assertAthleteActive,
  assertRoundOngoingForTiming,
  loadOfficialRound,
} from "@/lib/official-round-guards";
import { revalidateRaceDayViews } from "@/lib/revalidate-race-day";
import { allActiveAthletesFinished, finalizeRoundEnd } from "@/lib/round-lifecycle";

/**
 * Record a lap time for an athlete (Event Logger).
 * timeMs = race elapsed time in milliseconds at the moment the lap finished.
 */
export async function recordLapTime(athleteId: string, lapNumber: number, timeMs: number) {
  const session = await requireOfficialSession(["EVENT_LOGGER"]);
  const round = await loadOfficialRound(session.roundId);
  assertRoundOngoingForTiming(round);

  if (lapNumber < 1 || timeMs < 0) {
    throw new Error("ค่าไม่ถูกต้อง");
  }

  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId: session.roundId, athleteId, deletedAt: null },
    include: { athlete: { select: { name: true } } },
  });
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");
  assertAthleteActive(ra);

  const duplicateLap = await prisma.lapTime.findFirst({
    where: {
      roundId: session.roundId,
      athleteId,
      lapNumber,
      deletedAt: null,
    },
  });
  if (duplicateLap) {
    throw new Error(`บันทึก Lap ${lapNumber} ของนักกีฬาคนนี้ไปแล้ว`);
  }

  await prisma.lapTime.create({
    data: {
      roundId: session.roundId,
      athleteId,
      lapNumber,
      timeMs,
      recordedBy: session.judgeId,
      source: session.position,
    },
  });

  if (lapNumber > round.currentLap) {
    await prisma.round.update({
      where: { id: session.roundId },
      data: { currentLap: lapNumber },
    });
  }

  await prisma.roundActivityLog.create({
    data: {
      roundId: session.roundId,
      actorId: session.judgeId,
      actorName: session.judgeName,
      actorRole: session.position,
      actionType: "lap_time",
      targetAthleteId: athleteId,
      targetBib: ra.bib,
      lapNumber,
      details: `Lap ${lapNumber} - ${formatMs(timeMs)}`,
    },
  });

  revalidateRaceDayViews(session.eventId);
  return { ok: true };
}

/**
 * Record a finish time for an athlete. Position is auto-assigned based on
 * existing finish records (1 = first to finish).
 */
export async function recordFinishTime(athleteId: string, timeMs: number) {
  const session = await requireOfficialSession(["EVENT_LOGGER"]);
  const round = await loadOfficialRound(session.roundId);
  assertRoundOngoingForTiming(round);

  if (timeMs < 0) throw new Error("ค่าเวลาไม่ถูกต้อง");

  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId: session.roundId, athleteId, deletedAt: null },
    include: { athlete: { select: { name: true } } },
  });
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");
  assertAthleteActive(ra);

  const existing = await prisma.finishTime.findUnique({
    where: { roundId_athleteId: { roundId: session.roundId, athleteId } },
  });
  if (existing) throw new Error("บันทึกเวลาเข้าเส้นชัยของนักกีฬาคนนี้ไปแล้ว");

  const finishedCount = await prisma.finishTime.count({
    where: { roundId: session.roundId, deletedAt: null },
  });
  const position = finishedCount + 1;
  const lapCount = round.lapCount ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.finishTime.create({
      data: {
        roundId: session.roundId,
        athleteId,
        timeMs,
        position,
      },
    });

    // Final lap crossing is stored as finish — also persist LapTime for lap N so
    // lap lists match lapCount (e.g. 10/10 shows 10 rows, not 9 + finish only).
    if (lapCount > 0) {
      const finalLap = await tx.lapTime.findFirst({
        where: {
          roundId: session.roundId,
          athleteId,
          lapNumber: lapCount,
          deletedAt: null,
        },
      });
      if (!finalLap) {
        await tx.lapTime.create({
          data: {
            roundId: session.roundId,
            athleteId,
            lapNumber: lapCount,
            timeMs,
            recordedBy: session.judgeId,
            source: session.position,
          },
        });
        await tx.roundActivityLog.create({
          data: {
            roundId: session.roundId,
            actorId: session.judgeId,
            actorName: session.judgeName,
            actorRole: session.position,
            actionType: "lap_time",
            targetAthleteId: athleteId,
            targetBib: ra.bib,
            lapNumber: lapCount,
            details: `Lap ${lapCount} - ${formatMs(timeMs)}`,
          },
        });
      }
    }

    await tx.roundAthlete.update({
      where: { roundId_athleteId: { roundId: session.roundId, athleteId } },
      data: { position },
    });

    if (lapCount > 0 && lapCount > round.currentLap) {
      await tx.round.update({
        where: { id: session.roundId },
        data: { currentLap: lapCount },
      });
    }

    await tx.roundActivityLog.create({
      data: {
        roundId: session.roundId,
        actorId: session.judgeId,
        actorName: session.judgeName,
        actorRole: session.position,
        actionType: "finish_time",
        targetAthleteId: athleteId,
        targetBib: ra.bib,
        lapNumber: lapCount > 0 ? lapCount : undefined,
        details: `เข้าเส้นชัยอันดับ ${position} - ${formatMs(timeMs)}`,
      },
    });
  });

  // Auto-finish the round once every in-standing (OK) athlete has crossed the
  // line — the last finisher ends the race. DQ/DNF athletes never get a finish
  // time, so they don't hold the round open.
  let roundEnded = false;
  if (await allActiveAthletesFinished(session.roundId)) {
    const result = await finalizeRoundEnd(
      session.roundId,
      { id: "system", name: "ระบบ (อัตโนมัติ)", role: "MODERATOR" },
      "จบการแข่งขันอัตโนมัติ — นักกีฬาเข้าเส้นชัยครบทุกคน",
    );
    roundEnded = result.ended;
  }

  revalidateRaceDayViews(session.eventId);
  return { ok: true, roundEnded };
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

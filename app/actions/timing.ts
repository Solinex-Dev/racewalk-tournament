"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOfficialSession } from "@/lib/official-session";

/**
 * Record a lap time for an athlete (Event Logger / Timekeeper).
 * timeMs = race elapsed time in milliseconds at the moment the lap finished.
 */
export async function recordLapTime(athleteId: string, lapNumber: number, timeMs: number) {
  const session = await requireOfficialSession(["EVENT_LOGGER", "TIMEKEEPER"]);

  if (lapNumber < 1 || timeMs < 0) {
    throw new Error("ค่าไม่ถูกต้อง");
  }

  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId: session.roundId, athleteId, deletedAt: null },
    include: { athlete: { select: { name: true } } },
  });
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");

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

  revalidatePath(`/event-logger/events/${session.eventId}`);
  revalidatePath(`/timekeeper/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}/moderator`);
  return { ok: true };
}

/**
 * Record a finish time for an athlete. Position is auto-assigned based on
 * existing finish records (1 = first to finish).
 */
export async function recordFinishTime(athleteId: string, timeMs: number) {
  const session = await requireOfficialSession(["EVENT_LOGGER", "TIMEKEEPER"]);

  if (timeMs < 0) throw new Error("ค่าเวลาไม่ถูกต้อง");

  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId: session.roundId, athleteId, deletedAt: null },
    include: { athlete: { select: { name: true } } },
  });
  if (!ra) throw new Error("นักกีฬาไม่อยู่ในรอบนี้");

  const existing = await prisma.finishTime.findUnique({
    where: { roundId_athleteId: { roundId: session.roundId, athleteId } },
  });
  if (existing) throw new Error("บันทึกเวลาเข้าเส้นชัยของนักกีฬาคนนี้ไปแล้ว");

  const finishedCount = await prisma.finishTime.count({
    where: { roundId: session.roundId, deletedAt: null },
  });
  const position = finishedCount + 1;

  await prisma.finishTime.create({
    data: {
      roundId: session.roundId,
      athleteId,
      timeMs,
      position,
    },
  });

  await prisma.roundAthlete.update({
    where: { roundId_athleteId: { roundId: session.roundId, athleteId } },
    data: { position },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId: session.roundId,
      actorId: session.judgeId,
      actorName: session.judgeName,
      actorRole: session.position,
      actionType: "finish_time",
      targetAthleteId: athleteId,
      targetBib: ra.bib,
      details: `เข้าเส้นชัยอันดับ ${position} - ${formatMs(timeMs)}`,
    },
  });

  revalidatePath(`/event-logger/events/${session.eventId}`);
  revalidatePath(`/timekeeper/events/${session.eventId}`);
  revalidatePath(`/admin/events/${session.eventId}/moderator`);
  revalidatePath(`/events/${session.eventId}`);
  return { ok: true };
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

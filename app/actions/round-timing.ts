"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { revalidateRaceDayViews } from "@/lib/revalidate-race-day";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("ต้องเข้าสู่ระบบเป็นผู้ดูแล");
  if ((session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("ต้องเป็น Admin เท่านั้น");
  }
  return session.user;
}

/**
 * Keep Event.status in sync with the aggregate state of its rounds:
 *   - any round ONGOING            → Event ONGOING
 *   - all rounds FINISHED (>=1)    → Event FINISHED
 *   - otherwise (only SCHEDULED)   → leave SCHEDULED/DRAFT untouched
 * Returns the resulting event status (or null if event not found).
 */
async function syncEventStatus(eventId: string): Promise<"ONGOING" | "FINISHED" | null> {
  const rounds = await prisma.round.findMany({
    where: { eventId, deletedAt: null },
    select: { status: true },
  });
  if (rounds.length === 0) return null;

  const anyOngoing = rounds.some((r) => r.status === "ONGOING");
  const allFinished = rounds.every((r) => r.status === "FINISHED");

  let next: "ONGOING" | "FINISHED" | null = null;
  if (anyOngoing) next = "ONGOING";
  else if (allFinished) next = "FINISHED";

  if (next) {
    await prisma.event.updateMany({
      where: { id: eventId, status: { not: next } },
      data: { status: next },
    });
  }
  return next;
}

/**
 * Admin/Moderator: mark the race as started. Sets startedAt = now()
 * and status = ONGOING. All workspaces will use this timestamp to
 * compute elapsed time, keeping every role's clock in sync.
 * Also bumps the parent Event to ONGOING.
 */
export async function startRound(roundId: string) {
  const user = await requireAdmin();

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("ไม่พบรอบที่ระบุ");
  if (round.status === "FINISHED") throw new Error("รอบนี้จบไปแล้ว");

  const now = new Date();
  await prisma.round.update({
    where: { id: roundId },
    data: {
      status: "ONGOING",
      startedAt: round.startedAt ?? now,
    },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId,
      actorId: user.id,
      actorName: user.name ?? "Moderator",
      actorRole: "MODERATOR",
      actionType: "round_start",
      details: "เริ่มจับเวลาการแข่งขัน",
    },
  });

  // Event goes live the moment any round starts
  await syncEventStatus(round.eventId);

  await logCurrentAdmin(ActivityLogAction.ROUND_STARTED, "Round", roundId, { eventId: round.eventId });
  revalidatePath(`/admin/events`);
  revalidatePath(`/admin/events/${round.eventId}`);
  revalidateRaceDayViews(round.eventId);
  return { ok: true };
}

/**
 * Admin/Moderator: mark the race as finished. Sets endedAt = now()
 * and status = FINISHED. If this was the last unfinished round in the
 * event, the parent Event is also marked FINISHED.
 */
export async function endRound(roundId: string) {
  const user = await requireAdmin();

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("ไม่พบรอบที่ระบุ");
  if (round.status === "FINISHED") return { ok: true };

  const now = new Date();
  await prisma.round.update({
    where: { id: roundId },
    data: {
      status: "FINISHED",
      endedAt: now,
    },
  });

  await prisma.roundActivityLog.create({
    data: {
      roundId,
      actorId: user.id,
      actorName: user.name ?? "Moderator",
      actorRole: "MODERATOR",
      actionType: "round_end",
      details: "จบการแข่งขัน",
    },
  });

  // If every round is now finished, the event itself is finished
  const eventStatus = await syncEventStatus(round.eventId);

  await logCurrentAdmin(ActivityLogAction.ROUND_ENDED, "Round", roundId, {
    eventId: round.eventId,
    eventStatus,
  });
  revalidatePath(`/admin/events`);
  revalidatePath(`/admin/events/${round.eventId}`);
  revalidateRaceDayViews(round.eventId);
  return { ok: true };
}

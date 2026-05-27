"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

/**
 * Admin/Moderator: mark the race as started. Sets startedAt = now()
 * and status = ONGOING. All workspaces will use this timestamp to
 * compute elapsed time, keeping every role's clock in sync.
 */
export async function startRound(roundId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("ต้องเข้าสู่ระบบเป็นผู้ดูแล");
  if ((session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("ต้องเป็น Admin เท่านั้น");
  }

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
      actorId: session.user.id,
      actorName: session.user.name ?? "Moderator",
      actorRole: "MODERATOR",
      actionType: "round_start",
      details: "เริ่มจับเวลาการแข่งขัน",
    },
  });

  await logCurrentAdmin(ActivityLogAction.ROUND_STARTED, "Round", roundId, { eventId: round.eventId });
  revalidatePath(`/admin/events/${round.eventId}`);
  revalidatePath(`/admin/events/${round.eventId}/moderator`);
  revalidatePath(`/events/${round.eventId}`);
  return { ok: true };
}

/**
 * Admin/Moderator: mark the race as finished. Sets endedAt = now()
 * and status = FINISHED.
 */
export async function endRound(roundId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("ต้องเข้าสู่ระบบเป็นผู้ดูแล");
  if ((session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("ต้องเป็น Admin เท่านั้น");
  }

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
      actorId: session.user.id,
      actorName: session.user.name ?? "Moderator",
      actorRole: "MODERATOR",
      actionType: "round_end",
      details: "จบการแข่งขัน",
    },
  });

  await logCurrentAdmin(ActivityLogAction.ROUND_ENDED, "Round", roundId, { eventId: round.eventId });
  revalidatePath(`/admin/events/${round.eventId}`);
  revalidatePath(`/admin/events/${round.eventId}/moderator`);
  revalidatePath(`/events/${round.eventId}`);
  return { ok: true };
}

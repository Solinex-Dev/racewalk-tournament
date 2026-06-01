"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";
import { revalidateRaceDayViews } from "@/lib/revalidate-race-day";
import { syncEventStatus, finalizeRoundEnd } from "@/lib/round-lifecycle";

async function requireAdmin() {
  return requirePermission("events", "edit");
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

  // Mark the round finished + log it; if every round is now finished, the event
  // itself is finished. Shared with the automatic end-of-race trigger.
  const { eventStatus } = await finalizeRoundEnd(
    roundId,
    { id: user.id, name: user.name ?? "Moderator", role: "MODERATOR" },
    "จบการแข่งขัน",
  );

  await logCurrentAdmin(ActivityLogAction.ROUND_ENDED, "Round", roundId, {
    eventId: round.eventId,
    eventStatus,
  });
  revalidatePath(`/admin/events`);
  revalidatePath(`/admin/events/${round.eventId}`);
  revalidateRaceDayViews(round.eventId);
  return { ok: true };
}

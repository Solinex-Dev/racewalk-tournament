"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

/**
 * Admin/Moderator corrections — soft-deletes & edits with full audit trail.
 * All actions require ADMIN role.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("ต้องเข้าสู่ระบบเป็นผู้ดูแล");
  if ((session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("ต้องเป็น Admin เท่านั้น");
  }
  return session.user;
}

async function logModeratorAction(
  roundId: string,
  user: { id: string; name?: string | null },
  actionType: string,
  details: string,
  targetAthleteId?: string,
  targetBib?: string,
) {
  await prisma.roundActivityLog.create({
    data: {
      roundId,
      actorId: user.id,
      actorName: user.name ?? "Moderator",
      actorRole: "MODERATOR",
      actionType,
      details,
      targetAthleteId,
      targetBib,
    },
  });
}

// ─── Card overrides ──────────────────────────────────────────────────────────

export async function moderatorDeleteCard(cardId: string, reason: string) {
  const user = await requireAdmin();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      athlete: { select: { name: true } },
      judge: { select: { name: true } },
    },
  });
  if (!card) throw new Error("ไม่พบใบที่ระบุ");

  await prisma.card.update({
    where: { id: cardId },
    data: { deletedAt: new Date() },
  });

  await logModeratorAction(
    card.roundId,
    user,
    "moderator_delete_card",
    `ลบใบ${card.color === "YELLOW" ? "เหลือง" : "แดง"}ของ ${card.athlete.name} ที่ออกโดย ${card.judge.name} — เหตุผล: ${reason}`,
    card.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_DELETE_CARD, "Card", cardId, {
    roundId: card.roundId,
    athleteId: card.athleteId,
    color: card.color,
    reason,
  });

  // If we deleted a confirmed red, may need to recompute DQ status
  if (card.color === "RED" && card.state === "CONFIRMED") {
    const confirmedRed = await prisma.card.count({
      where: {
        roundId: card.roundId,
        athleteId: card.athleteId,
        color: "RED",
        state: "CONFIRMED",
        deletedAt: null,
      },
    });
    if (confirmedRed < 4) {
      await prisma.roundAthlete.updateMany({
        where: { roundId: card.roundId, athleteId: card.athleteId, status: "DQ" },
        data: { status: "OK" },
      });
    }
  }

  revalidatePath(`/admin/events`);
  return { ok: true };
}

// ─── Athlete status override ─────────────────────────────────────────────────

export async function moderatorOverrideAthleteStatus(
  roundId: string,
  athleteId: string,
  newStatus: "OK" | "DQ" | "DNF",
  reason: string,
) {
  const user = await requireAdmin();
  const ra = await prisma.roundAthlete.findFirst({
    where: { roundId, athleteId },
    include: { athlete: { select: { name: true } } },
  });
  if (!ra) throw new Error("ไม่พบนักกีฬาในรอบ");

  await prisma.roundAthlete.update({
    where: { id: ra.id },
    data: { status: newStatus },
  });

  await logModeratorAction(
    roundId,
    user,
    "moderator_override_status",
    `เปลี่ยนสถานะ ${ra.athlete.name} (Bib ${ra.bib}) จาก ${ra.status} เป็น ${newStatus} — เหตุผล: ${reason}`,
    athleteId,
    ra.bib,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_OVERRIDE_STATUS, "RoundAthlete", ra.id, {
    roundId,
    athleteId,
    from: ra.status,
    to: newStatus,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

// ─── Lap time edit/delete ────────────────────────────────────────────────────

export async function moderatorEditLapTime(lapTimeId: string, newTimeMs: number, reason: string) {
  const user = await requireAdmin();
  if (newTimeMs < 0) throw new Error("เวลาต้องเป็นค่าบวก");

  const lap = await prisma.lapTime.findUnique({
    where: { id: lapTimeId },
    include: { athlete: { select: { name: true } } },
  });
  if (!lap) throw new Error("ไม่พบ Lap time");

  await prisma.lapTime.update({
    where: { id: lapTimeId },
    data: { timeMs: newTimeMs },
  });

  await logModeratorAction(
    lap.roundId,
    user,
    "moderator_edit_lap",
    `แก้ไข Lap ${lap.lapNumber} ของ ${lap.athlete.name} จาก ${lap.timeMs}ms เป็น ${newTimeMs}ms — เหตุผล: ${reason}`,
    lap.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_EDIT_LAP, "LapTime", lapTimeId, {
    roundId: lap.roundId,
    athleteId: lap.athleteId,
    lapNumber: lap.lapNumber,
    fromMs: lap.timeMs,
    toMs: newTimeMs,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

export async function moderatorDeleteLapTime(lapTimeId: string, reason: string) {
  const user = await requireAdmin();
  const lap = await prisma.lapTime.findUnique({
    where: { id: lapTimeId },
    include: { athlete: { select: { name: true } } },
  });
  if (!lap) throw new Error("ไม่พบ Lap time");

  await prisma.lapTime.update({
    where: { id: lapTimeId },
    data: { deletedAt: new Date() },
  });

  await logModeratorAction(
    lap.roundId,
    user,
    "moderator_delete_lap",
    `ลบ Lap ${lap.lapNumber} ของ ${lap.athlete.name} — เหตุผล: ${reason}`,
    lap.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_DELETE_LAP, "LapTime", lapTimeId, {
    roundId: lap.roundId,
    athleteId: lap.athleteId,
    lapNumber: lap.lapNumber,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

// ─── Finish time edit/delete ─────────────────────────────────────────────────

export async function moderatorEditFinishTime(
  finishTimeId: string,
  newTimeMs: number,
  reason: string,
) {
  const user = await requireAdmin();
  if (newTimeMs < 0) throw new Error("เวลาต้องเป็นค่าบวก");

  const ft = await prisma.finishTime.findUnique({
    where: { id: finishTimeId },
    include: { athlete: { select: { name: true } } },
  });
  if (!ft) throw new Error("ไม่พบ Finish time");

  await prisma.finishTime.update({
    where: { id: finishTimeId },
    data: { timeMs: newTimeMs },
  });

  await logModeratorAction(
    ft.roundId,
    user,
    "moderator_edit_finish",
    `แก้ไขเวลาเข้าเส้นชัยของ ${ft.athlete.name} จาก ${ft.timeMs}ms เป็น ${newTimeMs}ms — เหตุผล: ${reason}`,
    ft.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_EDIT_FINISH, "FinishTime", finishTimeId, {
    roundId: ft.roundId,
    athleteId: ft.athleteId,
    fromMs: ft.timeMs,
    toMs: newTimeMs,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

export async function moderatorDeleteFinishTime(finishTimeId: string, reason: string) {
  const user = await requireAdmin();
  const ft = await prisma.finishTime.findUnique({
    where: { id: finishTimeId },
    include: { athlete: { select: { name: true } } },
  });
  if (!ft) throw new Error("ไม่พบ Finish time");

  await prisma.finishTime.update({
    where: { id: finishTimeId },
    data: { deletedAt: new Date() },
  });

  await prisma.roundAthlete.updateMany({
    where: { roundId: ft.roundId, athleteId: ft.athleteId },
    data: { position: null },
  });

  await logModeratorAction(
    ft.roundId,
    user,
    "moderator_delete_finish",
    `ลบเวลาเข้าเส้นชัยของ ${ft.athlete.name} (สามารถบันทึกใหม่ได้) — เหตุผล: ${reason}`,
    ft.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_DELETE_FINISH, "FinishTime", finishTimeId, {
    roundId: ft.roundId,
    athleteId: ft.athleteId,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

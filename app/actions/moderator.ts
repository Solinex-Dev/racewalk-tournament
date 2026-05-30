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

const RED_CARDS_TO_DQ = 4;

/**
 * Moderator confirms a PENDING red card on the Head Judge's behalf
 * (fallback when the head judge is unavailable). PENDING → CONFIRMED.
 * Auto-DQs the athlete when they reach RED_CARDS_TO_DQ confirmed reds.
 */
export async function moderatorConfirmRedCard(cardId: string, reason: string) {
  const user = await requireAdmin();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      athlete: { select: { name: true } },
      judge: { select: { name: true } },
    },
  });
  if (!card) throw new Error("ไม่พบใบที่ระบุ");
  if (card.color !== "RED" || card.state !== "PENDING") {
    throw new Error("ยืนยันได้เฉพาะใบแดงที่รอยืนยันเท่านั้น");
  }

  await prisma.card.update({
    where: { id: cardId },
    data: { state: "CONFIRMED", decidedBy: user.id, decidedAt: new Date() },
  });

  const confirmedRed = await prisma.card.count({
    where: {
      roundId: card.roundId,
      athleteId: card.athleteId,
      color: "RED",
      state: "CONFIRMED",
      deletedAt: null,
    },
  });

  let dq = false;
  if (confirmedRed >= RED_CARDS_TO_DQ) {
    await prisma.roundAthlete.updateMany({
      where: { roundId: card.roundId, athleteId: card.athleteId },
      data: { status: "DQ" },
    });
    dq = true;
    await logModeratorAction(
      card.roundId,
      user,
      "athlete_dq",
      `DQ - ครบใบแดง ${RED_CARDS_TO_DQ} ใบ (ยืนยันโดยผู้ดูแล)`,
      card.athleteId,
    );
  }

  await logModeratorAction(
    card.roundId,
    user,
    "moderator_confirm_red",
    `ยืนยันใบแดงของ ${card.athlete.name} (ออกโดย ${card.judge.name}) แทนหัวหน้ากรรมการ — เหตุผล: ${reason}`,
    card.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_CONFIRM_RED, "Card", cardId, {
    roundId: card.roundId,
    athleteId: card.athleteId,
    reason,
    autoDq: dq,
  });

  revalidatePath(`/admin/events`);
  return { ok: true, dq };
}

/**
 * Moderator rejects a PENDING red card on the Head Judge's behalf.
 * PENDING → OVERRIDDEN (does not count toward DQ).
 */
export async function moderatorRejectRedCard(cardId: string, reason: string) {
  const user = await requireAdmin();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      athlete: { select: { name: true } },
      judge: { select: { name: true } },
    },
  });
  if (!card) throw new Error("ไม่พบใบที่ระบุ");
  if (card.color !== "RED" || card.state !== "PENDING") {
    throw new Error("ยกเลิกได้เฉพาะใบแดงที่รอยืนยันเท่านั้น");
  }

  await prisma.card.update({
    where: { id: cardId },
    data: { state: "OVERRIDDEN", decidedBy: user.id, decidedAt: new Date() },
  });

  await logModeratorAction(
    card.roundId,
    user,
    "moderator_reject_red",
    `ยกเลิกใบแดงของ ${card.athlete.name} (ออกโดย ${card.judge.name}) แทนหัวหน้ากรรมการ — เหตุผล: ${reason}`,
    card.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_REJECT_RED, "Card", cardId, {
    roundId: card.roundId,
    athleteId: card.athleteId,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

function symbolLabel(s: string): string {
  return s === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ";
}

/**
 * Moderator edits a card's offence symbol (ยกเท้า ↔ เข่างอ) — e.g. the judge
 * recorded the wrong offence. Works on yellow or red cards.
 */
export async function moderatorEditCardSymbol(
  cardId: string,
  newSymbol: "LIFTED_FOOT" | "BENT_KNEE",
  reason: string,
) {
  const user = await requireAdmin();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      athlete: { select: { name: true } },
      judge: { select: { name: true } },
    },
  });
  if (!card) throw new Error("ไม่พบใบที่ระบุ");
  if (card.symbol === newSymbol) return { ok: true };

  await prisma.card.update({
    where: { id: cardId },
    data: { symbol: newSymbol },
  });

  await logModeratorAction(
    card.roundId,
    user,
    "moderator_edit_card",
    `แก้สัญลักษณ์ใบ${card.color === "YELLOW" ? "เหลือง" : "แดง"}ของ ${card.athlete.name} (ออกโดย ${card.judge.name}) จาก ${symbolLabel(card.symbol)} เป็น ${symbolLabel(newSymbol)} — เหตุผล: ${reason}`,
    card.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_EDIT_CARD, "Card", cardId, {
    roundId: card.roundId,
    athleteId: card.athleteId,
    from: card.symbol,
    to: newSymbol,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

/**
 * Moderator edits an athlete's finishing rank. Updates both the FinishTime row
 * and the RoundAthlete.position (the authoritative ranking used by scoreboards).
 * Does not re-order other athletes — the moderator is responsible for consistency.
 */
export async function moderatorEditFinishPosition(
  finishTimeId: string,
  newPosition: number,
  reason: string,
) {
  const user = await requireAdmin();
  if (!Number.isInteger(newPosition) || newPosition < 1) {
    throw new Error("อันดับต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
  }

  const ft = await prisma.finishTime.findUnique({
    where: { id: finishTimeId },
    include: { athlete: { select: { name: true } } },
  });
  if (!ft) throw new Error("ไม่พบเวลาเข้าเส้นชัย");

  const oldPos = ft.position;
  await prisma.finishTime.update({
    where: { id: finishTimeId },
    data: { position: newPosition },
  });
  await prisma.roundAthlete.updateMany({
    where: { roundId: ft.roundId, athleteId: ft.athleteId },
    data: { position: newPosition },
  });

  await logModeratorAction(
    ft.roundId,
    user,
    "moderator_edit_finish_position",
    `แก้อันดับของ ${ft.athlete.name} จาก ${oldPos} เป็น ${newPosition} — เหตุผล: ${reason}`,
    ft.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_EDIT_FINISH_POSITION, "FinishTime", finishTimeId, {
    roundId: ft.roundId,
    athleteId: ft.athleteId,
    from: oldPos,
    to: newPosition,
    reason,
  });

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

// ─── Full card edit (judge / color / symbol / time) ───────────────────────────

/**
 * Moderator edits all editable fields of a card at once. Handles state when the
 * color changes (yellow has no state; yellow→red starts PENDING; red→red keeps
 * its state) and recomputes DQ if a CONFIRMED red is converted away.
 */
export async function moderatorEditCard(
  cardId: string,
  data: {
    judgeId: string;
    color: "YELLOW" | "RED";
    symbol: "LIFTED_FOOT" | "BENT_KNEE";
    issuedAtMs?: number;
  },
  reason: string,
) {
  const user = await requireAdmin();
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { athlete: { select: { name: true } }, judge: { select: { name: true } } },
  });
  if (!card) throw new Error("ไม่พบใบที่ระบุ");

  const wasConfirmedRed = card.color === "RED" && card.state === "CONFIRMED";
  // New state for the (possibly) changed colour.
  const newState: "PENDING" | "CONFIRMED" | "OVERRIDDEN" | null =
    data.color === "YELLOW"
      ? null
      : card.color === "RED"
        ? (card.state ?? "PENDING")
        : "PENDING";

  await prisma.card.update({
    where: { id: cardId },
    data: {
      judgeId: data.judgeId,
      color: data.color,
      symbol: data.symbol,
      state: newState,
      ...(data.issuedAtMs ? { issuedAt: new Date(data.issuedAtMs) } : {}),
    },
  });

  // If a confirmed red was converted to yellow / non-confirmed, recompute DQ.
  if (wasConfirmedRed && newState !== "CONFIRMED") {
    const confirmedRed = await prisma.card.count({
      where: {
        roundId: card.roundId,
        athleteId: card.athleteId,
        color: "RED",
        state: "CONFIRMED",
        deletedAt: null,
      },
    });
    if (confirmedRed < RED_CARDS_TO_DQ) {
      await prisma.roundAthlete.updateMany({
        where: { roundId: card.roundId, athleteId: card.athleteId, status: "DQ" },
        data: { status: "OK" },
      });
    }
  }

  const symLabel = (s: string) => (s === "LIFTED_FOOT" ? "ยกเท้า" : "เข่างอ");
  await logModeratorAction(
    card.roundId,
    user,
    "moderator_edit_card",
    `แก้ไขใบของ ${card.athlete.name}: ${card.color === "YELLOW" ? "เหลือง" : "แดง"}/${symLabel(card.symbol)} (${card.judge.name}) → ${data.color === "YELLOW" ? "เหลือง" : "แดง"}/${symLabel(data.symbol)} — เหตุผล: ${reason}`,
    card.athleteId,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_EDIT_CARD, "Card", cardId, {
    roundId: card.roundId,
    athleteId: card.athleteId,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

// ─── Round info / timing edit ─────────────────────────────────────────────────

/**
 * Moderator corrects round metadata — name, distance, lap count, and the actual
 * start/end timestamps (the single source of truth for elapsed time).
 */
export async function moderatorEditRoundInfo(
  roundId: string,
  data: {
    name: string;
    distanceKm?: string;
    lapCount?: number;
    startedAtMs?: number | null;
    endedAtMs?: number | null;
  },
  reason: string,
) {
  const user = await requireAdmin();
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("ไม่พบรอบการแข่งขัน");
  if (!data.name.trim()) throw new Error("ต้องระบุชื่อรอบ");
  if (data.startedAtMs && data.endedAtMs && data.endedAtMs < data.startedAtMs) {
    throw new Error("เวลาจบต้องไม่น้อยกว่าเวลาเริ่ม");
  }

  await prisma.round.update({
    where: { id: roundId },
    data: {
      name: data.name.trim(),
      distanceKm: data.distanceKm?.trim() || null,
      lapCount: data.lapCount ? Math.max(1, Math.floor(data.lapCount)) : null,
      startedAt: data.startedAtMs ? new Date(data.startedAtMs) : null,
      endedAt: data.endedAtMs ? new Date(data.endedAtMs) : null,
    },
  });

  await logModeratorAction(
    roundId,
    user,
    "moderator_edit_round",
    `แก้ไขข้อมูลรอบ "${round.name}" — เหตุผล: ${reason}`,
  );
  await logCurrentAdmin(ActivityLogAction.MODERATOR_EDIT_ROUND, "Round", roundId, {
    name: data.name,
    reason,
  });

  revalidatePath(`/admin/events`);
  return { ok: true };
}

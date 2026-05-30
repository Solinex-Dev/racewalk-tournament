"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

type AthleteInput = { athleteId: string; bib: string };
type OfficialInput = {
  judgeId: string;
  zone?: string;
  secretCode: string;
  position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER";
};

export type RoundActionData = {
  name: string;
  scheduledTime?: string;
  distanceKm?: string;
  lapCount?: number;
  status: "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: AthleteInput[];
  officials: OfficialInput[];
};

/** Per-round official caps — 8 judges + 1 head judge + 1 event logger = 10 max. */
const MAX_JUDGES_PER_ROUND = 8;
const MAX_HEAD_JUDGE_PER_ROUND = 1;
const MAX_EVENT_LOGGER_PER_ROUND = 1;

function assertOfficialLimits(officials: OfficialInput[]) {
  const judges = officials.filter((o) => o.position === "JUDGE").length;
  const heads = officials.filter((o) => o.position === "HEAD_JUDGE").length;
  const loggers = officials.filter((o) => o.position === "EVENT_LOGGER").length;
  if (judges > MAX_JUDGES_PER_ROUND) {
    throw new Error(`กรรมการ (Judge) ต้องไม่เกิน ${MAX_JUDGES_PER_ROUND} คนต่อรอบ — ปัจจุบัน ${judges} คน`);
  }
  if (heads > MAX_HEAD_JUDGE_PER_ROUND) {
    throw new Error(`หัวหน้ากรรมการ ต้องไม่เกิน ${MAX_HEAD_JUDGE_PER_ROUND} คนต่อรอบ — ปัจจุบัน ${heads} คน`);
  }
  if (loggers > MAX_EVENT_LOGGER_PER_ROUND) {
    throw new Error(`ผู้เก็บ Lap Time ต้องไม่เกิน ${MAX_EVENT_LOGGER_PER_ROUND} คนต่อรอบ — ปัจจุบัน ${loggers} คน`);
  }
}

/**
 * Converts a Prisma unique-constraint failure (P2002) into a friendly Thai
 * message. RoundAthlete has @@unique([roundId, bib]) and RoundOfficial has
 * @@unique([roundId, secretCode]) — so a duplicate Bib or secret code surfaces
 * here. Duck-typed on `code` to avoid depending on Prisma's error-class export.
 */
function rethrowFriendly(err: unknown): never {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  ) {
    throw new Error(
      "บันทึกไม่สำเร็จ — มีข้อมูลซ้ำกันในรอบนี้ (เช่น หมายเลข Bib หรือ รหัสลับ ที่ซ้ำกัน) กรุณาแก้ไขรายการที่ขึ้นเตือนสีแดงแล้วบันทึกอีกครั้ง",
    );
  }
  throw err;
}

export async function createRound(eventId: string, data: RoundActionData) {
  assertOfficialLimits(data.officials);
  let createdId = "";
  await prisma.$transaction(async (tx) => {
    const round = await tx.round.create({
      data: {
        eventId,
        name: data.name,
        status: data.status,
        distanceKm: data.distanceKm || null,
        lapCount: data.lapCount ? Math.max(1, Math.floor(data.lapCount)) : null,
        scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      },
    });
    createdId = round.id;

    if (data.athletes.length > 0) {
      await tx.roundAthlete.createMany({
        data: data.athletes.map((a) => ({
          roundId: round.id,
          athleteId: a.athleteId,
          bib: a.bib,
        })),
      });
    }

    if (data.officials.length > 0) {
      await tx.roundOfficial.createMany({
        data: data.officials.map((o) => ({
          roundId: round.id,
          judgeId: o.judgeId,
          position: o.position,
          secretCode: o.secretCode,
          zone: o.zone || null,
        })),
      });
    }
  }).catch(rethrowFriendly);

  await logCurrentAdmin(ActivityLogAction.ROUND_CREATED, "Round", createdId, {
    eventId,
    name: data.name,
    athletes: data.athletes.length,
    officials: data.officials.length,
  });

  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

export async function updateRound(
  eventId: string,
  roundId: string,
  data: RoundActionData,
) {
  assertOfficialLimits(data.officials);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: roundId },
      data: {
        name: data.name,
        status: data.status,
        distanceKm: data.distanceKm || null,
        lapCount: data.lapCount ? Math.max(1, Math.floor(data.lapCount)) : null,
        scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      },
    });

    await tx.roundAthlete.updateMany({
      where: { roundId, deletedAt: null },
      data: { deletedAt: now },
    });
    for (const a of data.athletes) {
      await tx.roundAthlete.upsert({
        where: { roundId_athleteId: { roundId, athleteId: a.athleteId } },
        create: { roundId, athleteId: a.athleteId, bib: a.bib },
        update: { bib: a.bib, deletedAt: null },
      });
    }

    await tx.roundOfficial.updateMany({
      where: { roundId, deletedAt: null },
      data: { deletedAt: now },
    });
    for (const o of data.officials) {
      await tx.roundOfficial.upsert({
        where: { roundId_judgeId: { roundId, judgeId: o.judgeId } },
        create: {
          roundId,
          judgeId: o.judgeId,
          position: o.position,
          secretCode: o.secretCode,
          zone: o.zone || null,
        },
        update: {
          position: o.position,
          secretCode: o.secretCode,
          zone: o.zone || null,
          deletedAt: null,
        },
      });
    }
  }).catch(rethrowFriendly);

  await logCurrentAdmin(ActivityLogAction.ROUND_UPDATED, "Round", roundId, {
    eventId,
    name: data.name,
    status: data.status,
  });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

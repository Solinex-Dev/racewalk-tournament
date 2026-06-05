"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";
import { assertNoScheduleConflict, assertRoundWithinEvent } from "@/lib/scheduling";

type AthleteInput = { athleteId: string };
type OfficialInput = {
  judgeId: string;
  zone?: string;
  secretCode: string;
  position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER";
};

export type RoundActionData = {
  name: string;
  scheduledTime?: string;
  expectedEndTime?: string;
  distanceKm?: string;
  lapCount?: number;
  note?: string;
  status: "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: AthleteInput[];
  officials: OfficialInput[];
};

function normalizeNote(note?: string): string | null {
  const trimmed = note?.trim();
  return trimmed || null;
}

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
 * A round may only be ONGOING/FINISHED (i.e. "started") when it has at least one
 * head judge, one judge and one event logger. Otherwise it can only be SCHEDULED.
 */
function assertStartableOfficials(officials: OfficialInput[]) {
  const judges = officials.filter((o) => o.position === "JUDGE").length;
  const heads = officials.filter((o) => o.position === "HEAD_JUDGE").length;
  const loggers = officials.filter((o) => o.position === "EVENT_LOGGER").length;
  if (heads < 1 || judges < 1 || loggers < 1) {
    throw new Error(
      'ต้องมีหัวหน้ากรรมการ, กรรมการ และผู้เก็บ Lap Time อย่างน้อยอย่างละ 1 คน จึงจะเริ่มการแข่งขันได้ — ถ้ายังไม่ครบ บันทึกได้แค่สถานะ "กำหนดการ"',
    );
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
      "บันทึกไม่สำเร็จ — มีข้อมูลซ้ำกันในรอบนี้ (เช่น รหัสกรรมการที่ซ้ำกัน หรือ นักกีฬาที่ถูกเพิ่มซ้ำ) กรุณาแก้ไขรายการที่ขึ้นเตือนสีแดงแล้วบันทึกอีกครั้ง",
    );
  }
  throw err;
}

export async function createRound(eventId: string, data: RoundActionData) {
  await requirePermission("events", "create");
  assertOfficialLimits(data.officials);
  if (data.status !== "SCHEDULED") assertStartableOfficials(data.officials);

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true, status: true } });
  if (!event) throw new Error("ไม่พบกิจกรรม");
  if (event.status === "FINISHED") {
    throw new Error("กิจกรรมนี้จบการแข่งขันแล้ว — ไม่สามารถสร้างรอบใหม่ได้");
  }

  const scheduledTime = data.scheduledTime ? new Date(data.scheduledTime) : null;
  const expectedEndTime = data.expectedEndTime ? new Date(data.expectedEndTime) : null;

  assertRoundWithinEvent({ scheduledTime, expectedEndTime, eventDate: event.date });
  await assertNoScheduleConflict({
    eventId,
    eventDate: event.date,
    round: { scheduledTime, expectedEndTime, startedAt: null, endedAt: null, distanceKm: data.distanceKm || null },
    athleteIds: data.athletes.map((a) => a.athleteId),
    judgeIds: data.officials.map((o) => o.judgeId),
  });

  // Validate that every submitted athlete is registered in the event (has an EventAthlete row).
  if (data.athletes.length > 0) {
    const registered = await prisma.eventAthlete.findMany({
      where: { eventId, athleteId: { in: data.athletes.map((a) => a.athleteId) }, deletedAt: null },
      select: { athleteId: true },
    });
    const registeredIds = new Set(registered.map((r) => r.athleteId));
    const unregistered = data.athletes.filter((a) => !registeredIds.has(a.athleteId));
    if (unregistered.length > 0) {
      throw new Error(
        "นักกีฬาบางคนยังไม่ได้ลงทะเบียนในกิจกรรมนี้ — กรุณาเพิ่มนักกีฬาในหน้ากิจกรรมก่อน",
      );
    }
  }

  let createdId = "";
  await prisma.$transaction(async (tx) => {
    const round = await tx.round.create({
      data: {
        eventId,
        name: data.name,
        status: data.status,
        distanceKm: data.distanceKm || null,
        lapCount: data.lapCount ? Math.max(1, Math.floor(data.lapCount)) : null,
        scheduledTime,
        expectedEndTime,
        note: normalizeNote(data.note),
      },
    });
    createdId = round.id;

    if (data.athletes.length > 0) {
      await tx.roundAthlete.createMany({
        data: data.athletes.map((a, i) => ({
          roundId: round.id,
          athleteId: a.athleteId,
          sortOrder: i,
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

  // Use redirect() instead of return + router.push so that Next.js sends a
  // redirect response directly. Calling revalidatePath() before redirect() is
  // intentional — it marks the event page cache as stale so the next visit
  // picks up fresh data. With redirect(), Next.js uses createRedirectRenderResult
  // which skips re-rendering the current route server-side, avoiding the
  // "An error occurred in the Server Components render" error that surfaced
  // when generateFlight tried to re-render /rounds/new after the mutation.
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export async function updateRound(
  eventId: string,
  roundId: string,
  data: RoundActionData,
) {
  await requirePermission("events", "edit");
  assertOfficialLimits(data.officials);
  if (data.status !== "SCHEDULED") assertStartableOfficials(data.officials);

  const [event, existing] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { date: true } }),
    prisma.round.findUnique({ where: { id: roundId }, select: { startedAt: true, endedAt: true } }),
  ]);
  if (!event) throw new Error("ไม่พบกิจกรรม");

  const scheduledTime = data.scheduledTime ? new Date(data.scheduledTime) : null;
  const expectedEndTime = data.expectedEndTime ? new Date(data.expectedEndTime) : null;

  assertRoundWithinEvent({ scheduledTime, expectedEndTime, eventDate: event.date });
  await assertNoScheduleConflict({
    eventId,
    eventDate: event.date,
    round: {
      scheduledTime,
      expectedEndTime,
      startedAt: existing?.startedAt ?? null,
      endedAt: existing?.endedAt ?? null,
      distanceKm: data.distanceKm || null,
    },
    athleteIds: data.athletes.map((a) => a.athleteId),
    judgeIds: data.officials.map((o) => o.judgeId),
  });

  // Validate that every submitted athlete is registered in the event.
  if (data.athletes.length > 0) {
    const registered = await prisma.eventAthlete.findMany({
      where: { eventId, athleteId: { in: data.athletes.map((a) => a.athleteId) }, deletedAt: null },
      select: { athleteId: true },
    });
    const registeredIds = new Set(registered.map((r) => r.athleteId));
    const unregistered = data.athletes.filter((a) => !registeredIds.has(a.athleteId));
    if (unregistered.length > 0) {
      throw new Error(
        "นักกีฬาบางคนยังไม่ได้ลงทะเบียนในกิจกรรมนี้ — กรุณาเพิ่มนักกีฬาในหน้ากิจกรรมก่อน",
      );
    }
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: roundId },
      data: {
        name: data.name,
        status: data.status,
        distanceKm: data.distanceKm || null,
        lapCount: data.lapCount ? Math.max(1, Math.floor(data.lapCount)) : null,
        scheduledTime,
        expectedEndTime,
        note: normalizeNote(data.note),
      },
    });

    await tx.roundAthlete.updateMany({
      where: { roundId, deletedAt: null },
      data: { deletedAt: now },
    });
    // The array order IS the start-list order — persist each athlete's index.
    for (let i = 0; i < data.athletes.length; i++) {
      const a = data.athletes[i];
      await tx.roundAthlete.upsert({
        where: { roundId_athleteId: { roundId, athleteId: a.athleteId } },
        create: { roundId, athleteId: a.athleteId, sortOrder: i },
        update: { sortOrder: i, deletedAt: null },
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
  redirect(`/admin/events/${eventId}`);
}

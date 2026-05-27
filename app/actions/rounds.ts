"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

type AthleteInput = { athleteId: string; bib: string };
type OfficialInput = {
  judgeId: string;
  zone?: string;
  secretCode: string;
  position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER" | "TIMEKEEPER";
};

export type RoundActionData = {
  name: string;
  scheduledTime?: string;
  distanceKm?: string;
  status: "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: AthleteInput[];
  officials: OfficialInput[];
};

export async function createRound(eventId: string, data: RoundActionData) {
  let createdId = "";
  await prisma.$transaction(async (tx) => {
    const round = await tx.round.create({
      data: {
        eventId,
        name: data.name,
        status: data.status,
        distanceKm: data.distanceKm || null,
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
  });

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
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: roundId },
      data: {
        name: data.name,
        status: data.status,
        distanceKm: data.distanceKm || null,
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
  });

  await logCurrentAdmin(ActivityLogAction.ROUND_UPDATED, "Round", roundId, {
    eventId,
    name: data.name,
    status: data.status,
  });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

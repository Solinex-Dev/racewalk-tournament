"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

export type AthleteActionData = {
  name: string;
  country: string;
  affiliationId: string | null;
};

export async function createAthlete(data: AthleteActionData) {
  const athlete = await prisma.athlete.create({
    data: {
      name: data.name,
      country: data.country || "TH",
      affiliationId: data.affiliationId || null,
    },
  });
  await logCurrentAdmin(ActivityLogAction.ATHLETE_CREATED, "Athlete", athlete.id, {
    name: athlete.name,
    country: athlete.country,
  });
  revalidatePath("/admin/athletes");
  return { ok: true, id: athlete.id };
}

export async function updateAthlete(id: string, data: AthleteActionData) {
  await prisma.athlete.update({
    where: { id },
    data: {
      name: data.name,
      country: data.country || "TH",
      affiliationId: data.affiliationId || null,
    },
  });
  await logCurrentAdmin(ActivityLogAction.ATHLETE_UPDATED, "Athlete", id, {
    name: data.name,
    country: data.country,
  });
  revalidatePath("/admin/athletes");
  revalidatePath(`/admin/athletes/${id}`);
  return { ok: true };
}

export async function deleteAthlete(id: string) {
  await prisma.athlete.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logCurrentAdmin(ActivityLogAction.ATHLETE_DELETED, "Athlete", id);
  revalidatePath("/admin/athletes");
  return { ok: true };
}

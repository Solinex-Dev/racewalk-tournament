"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";
import { composeName } from "@/lib/person-name";

export type AthleteActionData = {
  prefix: string | null;
  firstName: string;
  lastName: string | null;
  country: string;
  affiliationId: string | null;
  province: string | null;
  club: string | null;
  note: string | null;
};

function buildAthleteData(data: AthleteActionData) {
  const prefix = data.prefix?.trim() || null;
  const firstName = data.firstName.trim();
  const lastName = data.lastName?.trim() || null;
  return {
    name: composeName({ prefix, firstName, lastName }),
    prefix,
    firstName,
    lastName,
    country: data.country || "TH",
    affiliationId: data.affiliationId || null,
    province: data.province?.trim() || null,
    club: data.club?.trim() || null,
    note: data.note?.trim() || null,
  };
}

export async function createAthlete(data: AthleteActionData) {
  await requirePermission("athletes", "create");
  const payload = buildAthleteData(data);
  if (!payload.firstName) throw new Error("กรุณากรอกชื่อจริง");

  const athlete = await prisma.athlete.create({ data: payload });
  await logCurrentAdmin(ActivityLogAction.ATHLETE_CREATED, "Athlete", athlete.id, {
    name: athlete.name,
    country: athlete.country,
  });
  revalidatePath("/admin/athletes");
  return { ok: true, id: athlete.id };
}

export async function updateAthlete(id: string, data: AthleteActionData) {
  await requirePermission("athletes", "edit");
  const payload = buildAthleteData(data);
  if (!payload.firstName) throw new Error("กรุณากรอกชื่อจริง");

  await prisma.athlete.update({ where: { id }, data: payload });
  await logCurrentAdmin(ActivityLogAction.ATHLETE_UPDATED, "Athlete", id, {
    name: payload.name,
    country: payload.country,
  });
  revalidatePath("/admin/athletes");
  revalidatePath(`/admin/athletes/${id}`);
  return { ok: true };
}

export async function deleteAthlete(id: string) {
  await requirePermission("athletes", "delete");
  await prisma.athlete.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logCurrentAdmin(ActivityLogAction.ATHLETE_DELETED, "Athlete", id);
  revalidatePath("/admin/athletes");
  return { ok: true };
}

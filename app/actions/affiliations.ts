"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

export type AffiliationActionData = {
  name: string;
};

export async function createAffiliation(data: AffiliationActionData) {
  const aff = await prisma.affiliation.create({
    data: { name: data.name },
  });
  await logCurrentAdmin(ActivityLogAction.AFFILIATION_CREATED, "Affiliation", aff.id, { name: aff.name });
  revalidatePath("/admin/affiliations");
  return { ok: true, id: aff.id };
}

export async function updateAffiliation(id: string, data: AffiliationActionData) {
  await prisma.affiliation.update({
    where: { id },
    data: { name: data.name },
  });
  await logCurrentAdmin(ActivityLogAction.AFFILIATION_UPDATED, "Affiliation", id, { name: data.name });
  revalidatePath("/admin/affiliations");
  revalidatePath(`/admin/affiliations/${id}`);
  return { ok: true };
}

export async function deleteAffiliation(id: string) {
  await prisma.affiliation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logCurrentAdmin(ActivityLogAction.AFFILIATION_DELETED, "Affiliation", id);
  revalidatePath("/admin/affiliations");
  return { ok: true };
}

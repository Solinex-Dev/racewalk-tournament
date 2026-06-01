"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";

export type AffiliationActionData = {
  name: string;
  country: string;
  province: string | null;
  headJudgeId: string | null;
  joinedAt: string | null;
  note: string | null;
};

function buildAffiliationData(data: AffiliationActionData) {
  return {
    name: data.name.trim(),
    country: data.country || "TH",
    province: data.province?.trim() || null,
    headJudgeId: data.headJudgeId || null,
    joinedAt: data.joinedAt ? new Date(data.joinedAt) : null,
    note: data.note?.trim() || null,
  };
}

export async function createAffiliation(data: AffiliationActionData) {
  await requirePermission("affiliations", "create");
  const payload = buildAffiliationData(data);
  if (!payload.name) throw new Error("กรุณากรอกชื่อสังกัด");

  const aff = await prisma.affiliation.create({ data: payload });
  await logCurrentAdmin(ActivityLogAction.AFFILIATION_CREATED, "Affiliation", aff.id, {
    name: aff.name,
  });
  revalidatePath("/admin/affiliations");
  return { ok: true, id: aff.id };
}

export async function updateAffiliation(id: string, data: AffiliationActionData) {
  await requirePermission("affiliations", "edit");
  const payload = buildAffiliationData(data);
  if (!payload.name) throw new Error("กรุณากรอกชื่อสังกัด");

  await prisma.affiliation.update({ where: { id }, data: payload });
  await logCurrentAdmin(ActivityLogAction.AFFILIATION_UPDATED, "Affiliation", id, {
    name: payload.name,
  });
  revalidatePath("/admin/affiliations");
  revalidatePath(`/admin/affiliations/${id}`);
  return { ok: true };
}

export async function deleteAffiliation(id: string) {
  await requirePermission("affiliations", "delete");
  await prisma.affiliation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logCurrentAdmin(ActivityLogAction.AFFILIATION_DELETED, "Affiliation", id);
  revalidatePath("/admin/affiliations");
  return { ok: true };
}

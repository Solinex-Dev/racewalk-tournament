"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";
import { composeName } from "@/lib/person-name";

export type JudgeActionData = {
  prefix: string | null;
  firstName: string;
  lastName: string | null;
  country: string;
  province: string | null;
  organizationId: string | null;
  departmentId: string | null;
  status: "ACTIVE" | "INACTIVE";
  note: string | null;
};

async function buildJudgeData(data: JudgeActionData) {
  const prefix = data.prefix?.trim() || null;
  const firstName = data.firstName.trim();
  const lastName = data.lastName?.trim() || null;

  let organizationId = data.organizationId || null;
  let departmentId = data.departmentId || null;
  // A department must belong to the chosen organization.
  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
      select: { organizationId: true },
    });
    if (!dept) {
      departmentId = null;
    } else if (organizationId && dept.organizationId !== organizationId) {
      throw new Error("แผนกที่เลือกไม่ได้อยู่ภายใต้องค์กรที่เลือก");
    } else {
      organizationId = dept.organizationId;
    }
  }

  return {
    name: composeName({ prefix, firstName, lastName }),
    prefix,
    firstName,
    lastName,
    country: data.country || "TH",
    province: data.province?.trim() || null,
    organizationId,
    departmentId,
    status: data.status,
    note: data.note?.trim() || null,
  };
}

export async function createJudge(data: JudgeActionData) {
  await requirePermission("judges", "create");
  const payload = await buildJudgeData(data);
  if (!payload.firstName) throw new Error("กรุณากรอกชื่อจริง");

  const judge = await prisma.judge.create({ data: payload });
  await logCurrentAdmin(ActivityLogAction.JUDGE_CREATED, "Judge", judge.id, { name: judge.name });
  revalidatePath("/admin/judges");
  return { ok: true, id: judge.id };
}

export async function updateJudge(id: string, data: JudgeActionData) {
  await requirePermission("judges", "edit");
  const payload = await buildJudgeData(data);
  if (!payload.firstName) throw new Error("กรุณากรอกชื่อจริง");

  await prisma.judge.update({ where: { id }, data: payload });
  await logCurrentAdmin(ActivityLogAction.JUDGE_UPDATED, "Judge", id, { name: payload.name });
  revalidatePath("/admin/judges");
  revalidatePath(`/admin/judges/${id}`);
  return { ok: true };
}

export async function deleteJudge(id: string) {
  await requirePermission("judges", "delete");
  await prisma.judge.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logCurrentAdmin(ActivityLogAction.JUDGE_DELETED, "Judge", id);
  revalidatePath("/admin/judges");
  return { ok: true };
}

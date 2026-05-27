"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

export type JudgeActionData = {
  name: string;
  country: string;
  province: string | null;
  department: string | null;
  organization: string | null;
  status: "ACTIVE" | "INACTIVE";
  note: string | null;
};

export async function createJudge(data: JudgeActionData) {
  const judge = await prisma.judge.create({
    data: {
      name: data.name,
      country: data.country || "TH",
      province: data.province?.trim() || null,
      department: data.department?.trim() || null,
      organization: data.organization?.trim() || null,
      status: data.status,
      note: data.note?.trim() || null,
    },
  });
  await logCurrentAdmin(ActivityLogAction.JUDGE_CREATED, "Judge", judge.id, { name: judge.name });
  revalidatePath("/admin/judges");
  return { ok: true, id: judge.id };
}

export async function updateJudge(id: string, data: JudgeActionData) {
  await prisma.judge.update({
    where: { id },
    data: {
      name: data.name,
      country: data.country || "TH",
      province: data.province?.trim() || null,
      department: data.department?.trim() || null,
      organization: data.organization?.trim() || null,
      status: data.status,
      note: data.note?.trim() || null,
    },
  });
  await logCurrentAdmin(ActivityLogAction.JUDGE_UPDATED, "Judge", id, { name: data.name });
  revalidatePath("/admin/judges");
  revalidatePath(`/admin/judges/${id}`);
  return { ok: true };
}

export async function deleteJudge(id: string) {
  await prisma.judge.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logCurrentAdmin(ActivityLogAction.JUDGE_DELETED, "Judge", id);
  revalidatePath("/admin/judges");
  return { ok: true };
}

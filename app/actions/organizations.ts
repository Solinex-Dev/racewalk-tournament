"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

// Organizations & their departments are managed from the judges page. Permission
// is gated under the "judges" resource (they exist to organize judges).

export async function createOrganization(data: { name: string; note?: string | null }) {
  const me = await requirePermission("judges", "create");
  const name = data.name.trim();
  if (!name) throw new Error("กรุณากรอกชื่อองค์กร");
  const org = await prisma.organization.create({
    data: { name, note: data.note?.trim() || null, createdById: me.id, updatedById: me.id },
  });
  await logCurrentAdmin(ActivityLogAction.ORGANIZATION_CREATED, "Organization", org.id, { name: org.name });
  revalidatePath("/admin/judges");
  return { id: org.id, name: org.name };
}

export async function updateOrganization(id: string, data: { name: string; note?: string | null }) {
  const me = await requirePermission("judges", "edit");
  const name = data.name.trim();
  if (!name) throw new Error("กรุณากรอกชื่อองค์กร");
  await prisma.organization.update({
    where: { id },
    data: { name, note: data.note?.trim() || null, updatedById: me.id },
  });
  await logCurrentAdmin(ActivityLogAction.ORGANIZATION_UPDATED, "Organization", id, { name });
  revalidatePath("/admin/judges");
  return { ok: true };
}

export async function deleteOrganization(id: string) {
  const me = await requirePermission("judges", "delete");
  const now = new Date();
  await prisma.$transaction([
    prisma.department.updateMany({
      where: { organizationId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.organization.update({ where: { id }, data: { deletedAt: now, updatedById: me.id } }),
    prisma.judge.updateMany({
      where: { organizationId: id },
      data: { organizationId: null, departmentId: null },
    }),
  ]);
  await logCurrentAdmin(ActivityLogAction.ORGANIZATION_DELETED, "Organization", id);
  revalidatePath("/admin/judges");
  return { ok: true };
}

export async function createDepartment(data: {
  organizationId: string;
  name: string;
  note?: string | null;
}) {
  const me = await requirePermission("judges", "create");
  const name = data.name.trim();
  if (!name) throw new Error("กรุณากรอกชื่อแผนก");
  const org = await prisma.organization.findFirst({
    where: { id: data.organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!org) throw new Error("ไม่พบองค์กรที่เลือก");
  try {
    const dept = await prisma.department.create({
      data: {
        organizationId: org.id,
        name,
        note: data.note?.trim() || null,
        createdById: me.id,
        updatedById: me.id,
      },
    });
    await logCurrentAdmin(ActivityLogAction.DEPARTMENT_CREATED, "Department", dept.id, { name: dept.name });
    revalidatePath("/admin/judges");
    return { id: dept.id, name: dept.name, organizationId: org.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("มีแผนกชื่อนี้อยู่แล้วในองค์กรนี้");
    }
    throw err;
  }
}

export async function updateDepartment(id: string, data: { name: string; note?: string | null }) {
  const me = await requirePermission("judges", "edit");
  const name = data.name.trim();
  if (!name) throw new Error("กรุณากรอกชื่อแผนก");
  await prisma.department.update({
    where: { id },
    data: { name, note: data.note?.trim() || null, updatedById: me.id },
  });
  await logCurrentAdmin(ActivityLogAction.DEPARTMENT_UPDATED, "Department", id, { name });
  revalidatePath("/admin/judges");
  return { ok: true };
}

export async function deleteDepartment(id: string) {
  const me = await requirePermission("judges", "delete");
  await prisma.$transaction([
    prisma.department.update({ where: { id }, data: { deletedAt: new Date(), updatedById: me.id } }),
    prisma.judge.updateMany({ where: { departmentId: id }, data: { departmentId: null } }),
  ]);
  await logCurrentAdmin(ActivityLogAction.DEPARTMENT_DELETED, "Department", id);
  revalidatePath("/admin/judges");
  return { ok: true };
}

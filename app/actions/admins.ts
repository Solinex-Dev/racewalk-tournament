"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, isValidEmailFormat, validatePasswordLength } from "@/lib/validation";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { requirePermission } from "@/lib/authz";
import { composeName } from "@/lib/person-name";
import { normalizePermissions, type PermissionMatrix } from "@/lib/permissions";

export type AdminActionData = {
  prefix: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  email: string;
  title: string;
  password?: string;
  status: "ACTIVE" | "SUSPENDED";
  isRoot: boolean;
  permissions: PermissionMatrix;
};

async function countOtherRoots(excludeId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      isRoot: true,
      deletedAt: null,
      status: { not: "DELETED" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function createAdmin(data: AdminActionData) {
  const me = await requirePermission("admins", "create");

  const email = normalizeEmail(data.email);
  if (!isValidEmailFormat(email)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
  if (!data.password) throw new Error("ต้องระบุรหัสผ่าน");
  const pwResult = validatePasswordLength(data.password);
  if (!pwResult.ok) throw new Error(pwResult.error ?? "รหัสผ่านไม่ถูกต้อง");
  const firstName = data.firstName.trim();
  if (!firstName) throw new Error("กรุณากรอกชื่อจริง");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("อีเมลนี้ถูกใช้แล้ว");

  // Only a Root Admin may grant Root.
  const isRoot = data.isRoot && me.isRoot;
  const prefix = data.prefix?.trim() || null;
  const middleName = data.middleName?.trim() || null;
  const lastName = data.lastName?.trim() || null;
  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: composeName({ prefix, firstName, middleName, lastName }),
      prefix,
      firstName,
      middleName,
      lastName,
      title: data.title.trim(),
      role: "ADMIN",
      status: data.status,
      isRoot,
      permissions: normalizePermissions(data.permissions),
      password: passwordHash,
      emailVerified: new Date(),
      createdById: me.id,
      updatedById: me.id,
    },
  });
  await logCurrentAdmin(ActivityLogAction.ADMIN_CREATED, "User", user.id, {
    email: user.email,
    title: user.title,
    isRoot,
  });
  revalidatePath("/admin/admins");
  return { ok: true, id: user.id };
}

export async function updateAdmin(id: string, data: AdminActionData) {
  const me = await requirePermission("admins", "edit");

  const target = await prisma.user.findUnique({
    where: { id },
    select: { isRoot: true },
  });
  if (!target) throw new Error("ไม่พบผู้ดูแล");
  // A non-root admin may not edit a Root Admin.
  if (target.isRoot && !me.isRoot) {
    throw new Error("เฉพาะ Root Admin เท่านั้นที่แก้ไข Root Admin ได้");
  }

  const email = normalizeEmail(data.email);
  if (!isValidEmailFormat(email)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
  const firstName = data.firstName.trim();
  if (!firstName) throw new Error("กรุณากรอกชื่อจริง");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) throw new Error("อีเมลนี้ถูกใช้แล้ว");

  // Only a Root may change the Root flag; others keep the target's current flag.
  const isRoot = me.isRoot ? data.isRoot : target.isRoot;
  // Never drop below one Root Admin.
  if (target.isRoot && !isRoot && (await countOtherRoots(id)) === 0) {
    throw new Error("ต้องมี Root Admin อย่างน้อย 1 คนในระบบ");
  }

  const prefix = data.prefix?.trim() || null;
  const middleName = data.middleName?.trim() || null;
  const lastName = data.lastName?.trim() || null;

  const updates: Parameters<typeof prisma.user.update>[0]["data"] = {
    email,
    name: composeName({ prefix, firstName, middleName, lastName }),
    prefix,
    firstName,
    middleName,
    lastName,
    title: data.title.trim(),
    status: data.status,
    suspendedAt: data.status === "SUSPENDED" ? new Date() : null,
    isRoot,
    permissions: normalizePermissions(data.permissions),
    updatedById: me.id,
  };

  if (data.password && data.password.length > 0) {
    const pwResult = validatePasswordLength(data.password);
    if (!pwResult.ok) throw new Error(pwResult.error ?? "รหัสผ่านไม่ถูกต้อง");
    updates.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({ where: { id }, data: updates });
  await logCurrentAdmin(ActivityLogAction.ADMIN_UPDATED, "User", id, {
    email,
    title: data.title,
    status: data.status,
    isRoot,
    passwordChanged: Boolean(data.password),
  });
  revalidatePath("/admin/admins");
  revalidatePath(`/admin/admins/${id}`);
  return { ok: true };
}

export async function deleteAdmin(id: string) {
  const me = await requirePermission("admins", "delete");
  const target = await prisma.user.findUnique({
    where: { id },
    select: { isRoot: true },
  });
  if (!target) throw new Error("ไม่พบผู้ดูแล");
  if (target.isRoot) {
    if (!me.isRoot) throw new Error("เฉพาะ Root Admin เท่านั้นที่ลบ Root Admin ได้");
    if ((await countOtherRoots(id)) === 0) {
      throw new Error("ต้องมี Root Admin อย่างน้อย 1 คน — ลบไม่ได้");
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      deleteAfter: null,
    },
  });
  await logCurrentAdmin(ActivityLogAction.ADMIN_DELETED, "User", id);
  revalidatePath("/admin/admins");
  return { ok: true };
}

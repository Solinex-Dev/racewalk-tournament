"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, isValidEmailFormat, validatePasswordLength } from "@/lib/validation";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";

export type AdminActionData = {
  name: string;
  email: string;
  title: string;
  password?: string;
  status: "ACTIVE" | "SUSPENDED";
};

export async function createAdmin(data: AdminActionData) {
  const email = normalizeEmail(data.email);
  if (!isValidEmailFormat(email)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
  if (!data.password) throw new Error("ต้องระบุรหัสผ่าน");
  const pwResult = validatePasswordLength(data.password);
  if (!pwResult.ok) throw new Error(pwResult.error ?? "รหัสผ่านไม่ถูกต้อง");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("อีเมลนี้ถูกใช้แล้ว");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      title: data.title,
      role: "ADMIN",
      status: data.status,
      password: passwordHash,
      emailVerified: new Date(),
    },
  });
  await logCurrentAdmin(ActivityLogAction.ADMIN_CREATED, "User", user.id, {
    email: user.email,
    title: user.title,
  });
  revalidatePath("/admin/admins");
  return { ok: true, id: user.id };
}

export async function updateAdmin(id: string, data: AdminActionData) {
  const email = normalizeEmail(data.email);
  if (!isValidEmailFormat(email)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง");

  const updates: Parameters<typeof prisma.user.update>[0]["data"] = {
    email,
    name: data.name,
    title: data.title,
    status: data.status,
    suspendedAt: data.status === "SUSPENDED" ? new Date() : null,
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
    passwordChanged: Boolean(data.password),
  });
  revalidatePath("/admin/admins");
  revalidatePath(`/admin/admins/${id}`);
  return { ok: true };
}

export async function deleteAdmin(id: string) {
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

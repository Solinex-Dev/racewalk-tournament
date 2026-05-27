"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeEmail,
  isValidEmailFormat,
  validatePasswordLength,
} from "@/lib/validation";
import { createActivityLog, ActivityLogAction } from "@/lib/activity-log";

export async function updateMyProfile(data: { name: string; email: string; title: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const email = normalizeEmail(data.email);
  if (!isValidEmailFormat(email)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง");

  // Check email uniqueness if changed
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    throw new Error("อีเมลนี้ถูกใช้แล้ว");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name.trim(),
      email,
      title: data.title.trim(),
    },
  });

  await createActivityLog({
    userId: session.user.id,
    action: ActivityLogAction.USER_PROFILE_UPDATED,
    entityType: "User",
    entityId: session.user.id,
    details: { email, title: data.title },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const pwResult = validatePasswordLength(newPassword);
  if (!pwResult.ok) throw new Error(pwResult.error ?? "รหัสผ่านไม่ถูกต้อง");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.password) {
    throw new Error("ไม่พบบัญชีหรือบัญชีนี้ไม่ใช้รหัสผ่าน");
  }

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");

  const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
  if (sameAsCurrent) throw new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: newHash },
  });

  await createActivityLog({
    userId: session.user.id,
    action: ActivityLogAction.USER_PASSWORD_CHANGED,
    entityType: "User",
    entityId: session.user.id,
  });

  return { ok: true };
}

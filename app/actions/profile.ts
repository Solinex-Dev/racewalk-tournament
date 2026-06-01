"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeEmail,
  isValidEmailFormat,
  validatePasswordLength,
} from "@/lib/validation";
import { createActivityLog, ActivityLogAction } from "@/lib/activity-log";
import { isAdminSession } from "@/lib/admin-auth-redirect";
import { composeName } from "@/lib/person-name";

function requireAdminUserId(session: Session | null) {
  const role = session?.user?.role;
  const userId = session?.user?.id;
  if (!isAdminSession(role, userId)) {
    throw new Error("ไม่ได้เข้าสู่ระบบ");
  }
  return userId!;
}

export async function updateMyProfile(data: {
  prefix: string | null;
  firstName: string;
  lastName: string | null;
  email: string;
  title: string;
}) {
  const session = await getServerSession(authOptions);
  const userId = requireAdminUserId(session);

  const email = normalizeEmail(data.email);
  if (!isValidEmailFormat(email)) throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
  const firstName = data.firstName.trim();
  if (!firstName) throw new Error("กรุณากรอกชื่อจริง");

  // Check email uniqueness if changed
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new Error("อีเมลนี้ถูกใช้แล้ว");
  }

  const prefix = data.prefix?.trim() || null;
  const lastName = data.lastName?.trim() || null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: composeName({ prefix, firstName, lastName }),
      prefix,
      firstName,
      lastName,
      email,
      title: data.title.trim(),
    },
  });

  await createActivityLog({
    userId,
    action: ActivityLogAction.USER_PROFILE_UPDATED,
    entityType: "User",
    entityId: userId,
    details: { email, title: data.title },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  const userId = requireAdminUserId(session);

  const pwResult = validatePasswordLength(newPassword);
  if (!pwResult.ok) throw new Error(pwResult.error ?? "รหัสผ่านไม่ถูกต้อง");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new Error("ไม่พบบัญชีหรือบัญชีนี้ไม่ใช้รหัสผ่าน");
  }

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");

  const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
  if (sameAsCurrent) throw new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: newHash },
  });

  await createActivityLog({
    userId,
    action: ActivityLogAction.USER_PASSWORD_CHANGED,
    entityType: "User",
    entityId: userId,
  });

  return { ok: true };
}

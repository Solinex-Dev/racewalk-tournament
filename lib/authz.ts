/**
 * Server-side authorization. Resolves the current admin from the session and
 * re-reads their permissions from the DB on every check, so permission changes
 * take effect immediately (no stale JWT). Mutating Server Actions call
 * {@link requirePermission}; page Server Components use {@link getCurrentAdmin}
 * + `hasPermission` to gate views.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type Action, type Resource } from "@/lib/permissions";

export type CurrentAdmin = {
  id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  role: string;
  isRoot: boolean;
  permissions: unknown;
  status: string;
};

/** The signed-in, ACTIVE admin (or null). Fresh permissions from the DB. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      role: true,
      isRoot: true,
      permissions: true,
      status: true,
    },
  });
  if (user?.role !== "ADMIN" || user.status !== "ACTIVE") return null;
  return user;
}

/** Throw unless the current admin may perform `action` on `resource`. */
export async function requirePermission(
  resource: Resource,
  action: Action,
): Promise<CurrentAdmin> {
  const user = await getCurrentAdmin();
  if (!user) throw new Error("ต้องเข้าสู่ระบบเป็นผู้ดูแล");
  if (!hasPermission(user, resource, action)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
  return user;
}

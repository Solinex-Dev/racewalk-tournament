import { prisma } from "@/lib/prisma";

export type AuditMeta = {
  createdByName: string | null;
  createdAt: Date | null;
  updatedByName: string | null;
  updatedAt: Date | null;
};

/**
 * Resolve the display names of the admins who created / last updated a record
 * (from its `createdById` / `updatedById` audit fields). Null names mean the
 * record predates audit tracking (e.g. seed data).
 */
export async function resolveAudit(record: {
  createdById?: string | null;
  updatedById?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}): Promise<AuditMeta> {
  const ids = [record.createdById, record.updatedById].filter(Boolean) as string[];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(ids)] } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name?.trim() || u.email || "—"]));
  return {
    createdByName: record.createdById ? nameById.get(record.createdById) ?? null : null,
    createdAt: record.createdAt ?? null,
    updatedByName: record.updatedById ? nameById.get(record.updatedById) ?? null : null,
    updatedAt: record.updatedAt ?? null,
  };
}

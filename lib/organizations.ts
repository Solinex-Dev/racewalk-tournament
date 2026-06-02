import { prisma } from "@/lib/prisma";

export type OrgTreeDepartment = { id: string; name: string };
export type OrgTreeNode = { id: string; name: string; departments: OrgTreeDepartment[] };

/** Organizations with their (non-deleted) departments, for the judge form + manager. */
export async function getOrganizationsTree(): Promise<OrgTreeNode[]> {
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      departments: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });
  return orgs.map((o) => ({ id: o.id, name: o.name, departments: o.departments }));
}

import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { JudgesList } from "@/components/judges/judges-list";
import { OrgDepartmentManager } from "@/components/judges/org-department-manager";
import { CsvExportImport } from "@/components/admin/csv-export-import";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { countryLabel } from "@/lib/data/countries";
import { getOrganizationsTree } from "@/lib/organizations";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { canAccessResource, hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "จัดการกรรมการ – การแข่งขันเดินทน",
  description:
    "หน้ารายการกรรมการทั้งหมดพร้อมลิงก์เข้าไปดู / แก้ไข และสร้างกรรมการใหม่",
};

export default async function JudgesPage() {
  const me = await getCurrentAdmin();
  if (!canAccessResource(me, "judges")) return <NoAccess />;

  const [rows, organizations] = await Promise.all([
    prisma.judge.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
    getOrganizationsTree(),
  ]);

  const judges = rows.map((j) => ({
    id: j.id,
    prefix: j.prefix ?? "",
    first_name: j.firstName ?? j.name,
    middle_name: j.middleName ?? "",
    last_name: j.lastName ?? "",
    country: countryLabel(j.country),
    province: j.province ?? "",
    department: j.department?.name ?? "",
    organization: j.organization?.name ?? "",
    note: j.note ?? "",
    status: (j.status === "ACTIVE" ? "active" : "inactive") as "active" | "inactive",
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "กรรมการ" },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการกรรมการ
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการกรรมการทั้งหมดพร้อมลิงก์เข้าไปดู / แก้ไข
              และสร้างกรรมการใหม่
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {me?.isRoot && (
              <CsvExportImport entity="judge" exportHref="/api/admin/export/judges" />
            )}
            {(hasPermission(me, "judges", "create") ||
              hasPermission(me, "judges", "edit") ||
              hasPermission(me, "judges", "delete")) && (
              <OrgDepartmentManager organizations={organizations} />
            )}
            {hasPermission(me, "judges", "create") && (
              <Link href="/admin/judges/new">
                <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                  + เพิ่มกรรมการใหม่
                </Button>
              </Link>
            )}
          </div>
        </div>

        <JudgesList judges={judges} />
      </div>
    </main>
  );
}

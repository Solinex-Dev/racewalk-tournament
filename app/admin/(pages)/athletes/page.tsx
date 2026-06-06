import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AthletesList } from "@/components/athletes/athletes-list";
import { CsvExportImport } from "@/components/admin/csv-export-import";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { countryLabel } from "@/lib/data/countries";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { canAccessResource, hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "จัดการนักกีฬา – การแข่งขันเดินทน",
  description:
    "หน้ารายการนักกีฬาทั้งหมดพร้อมลิงก์เข้าไปดู / แก้ไข และสร้างนักกีฬาใหม่",
};

export default async function AthletesPage() {
  const me = await getCurrentAdmin();
  if (!canAccessResource(me, "athletes")) return <NoAccess />;

  const rows = await prisma.athlete.findMany({
    where: { deletedAt: null },
    include: { affiliation: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const athletes = rows.map((a) => ({
    id: a.id,
    prefix: a.prefix ?? "",
    first_name: a.firstName ?? a.name,
    middle_name: a.middleName ?? "",
    last_name: a.lastName ?? "",
    affiliation: a.affiliation?.name ?? "",
    club: a.club ?? "",
    country: countryLabel(a.country),
    province: a.province ?? "",
    note: a.note ?? "",
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "นักกีฬา" },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการนักกีฬา
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการนักกีฬาทั้งหมดพร้อมลิงก์เข้าไปดู / แก้ไข
              และสร้างนักกีฬาใหม่
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {me?.isRoot && (
              <CsvExportImport entity="athlete" exportHref="/api/admin/export/athletes" />
            )}
            {hasPermission(me, "athletes", "create") && (
              <Link href="/admin/athletes/new">
                <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                  + เพิ่มนักกีฬาใหม่
                </Button>
              </Link>
            )}
          </div>
        </div>

        <AthletesList athletes={athletes} />
      </div>
    </main>
  );
}

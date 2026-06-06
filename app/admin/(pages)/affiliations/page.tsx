import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AffiliationsList } from "@/components/affiliations/affiliations-list";
import { CsvExportImport } from "@/components/admin/csv-export-import";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { countryLabel } from "@/lib/data/countries";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { canAccessResource, hasPermission } from "@/lib/permissions";

export const metadata = {
  title: "จัดการสังกัด / สโมสร (Affiliations)",
  description:
    "หน้ารายการสังกัด / สโมสรพร้อมลิงก์ดูรายละเอียดสำหรับดูรายชื่อ Athlete",
};

export default async function AffiliationsPage() {
  const me = await getCurrentAdmin();
  if (!canAccessResource(me, "affiliations")) return <NoAccess />;

  const rows = await prisma.affiliation.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { headJudge: { select: { name: true } } },
  });

  const affiliations = rows.map((a) => ({
    id: a.id,
    name: a.name,
    country: countryLabel(a.country),
    province: a.province ?? "",
    head_of_affiliation: a.headJudge?.name ?? "",
    join_at: (a.joinedAt ?? a.createdAt).toISOString().slice(0, 10),
    note: a.note ?? "",
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "สังกัด" },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการสังกัด / สโมสร
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการสังกัด / สโมสรพร้อมลิงก์ดูรายละเอียดสำหรับดูรายชื่อ
              Athlete
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {me?.isRoot && (
              <CsvExportImport entity="affiliation" exportHref="/api/admin/export/affiliations" />
            )}
            {hasPermission(me, "affiliations", "create") && (
              <Link href="/admin/affiliations/new">
                <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                  + เพิ่มสังกัด / สโมสรใหม่
                </Button>
              </Link>
            )}
          </div>
        </div>

        <AffiliationsList affiliations={affiliations} />
      </div>
    </main>
  );
}

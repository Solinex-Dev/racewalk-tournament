import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AffiliationForm } from "@/components/affiliations/affiliation-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { getCountryComboboxOptions } from "@/lib/data/countries";
import { getProvinceComboboxOptions } from "@/lib/data/provinces";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { resolveAudit } from "@/lib/audit";
import { AuditInfo } from "@/components/common/audit-info";

export const metadata: Metadata = {
  title: "แก้ไขสังกัด / สโมสร – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลสังกัด / สโมสร",
};

type Props = { params: Promise<{ affiliationId: string }> };

export default async function AffiliationDetailPage(props: Readonly<Props>) {
  const { affiliationId } = await props.params;

  const [aff, judges] = await Promise.all([
    prisma.affiliation.findUnique({ where: { id: affiliationId, deletedAt: null } }),
    prisma.judge.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!aff) notFound();

  const me = await getCurrentAdmin();
  if (!hasPermission(me, "affiliations", "view")) return <NoAccess />;

  const countryOptions = getCountryComboboxOptions();
  const provinceOptions = getProvinceComboboxOptions();
  const audit = await resolveAudit(aff);

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "สังกัด", href: "/admin/affiliations" },
            { label: aff.name },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขสังกัด / สโมสร
            </h1>
            <p className="mt-1 text-sm text-slate-600">ดูและอัปเดตข้อมูลสังกัด / สโมสรที่เลือก</p>
          </div>

          <Link href="/admin/affiliations">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AffiliationForm
          mode="edit"
          affiliationId={affiliationId}
          countryOptions={countryOptions}
          provinceOptions={provinceOptions}
          judges={judges}
          canEdit={hasPermission(me, "affiliations", "edit")}
          canDelete={hasPermission(me, "affiliations", "delete")}
          defaultValues={{
            name: aff.name,
            country: aff.country,
            province: aff.province ?? "",
            headJudgeId: aff.headJudgeId ?? "",
            joinedAt: aff.joinedAt ? aff.joinedAt.toISOString().slice(0, 10) : "",
            note: aff.note ?? "",
          }}
        />

        <AuditInfo {...audit} />
      </div>
    </main>
  );
}

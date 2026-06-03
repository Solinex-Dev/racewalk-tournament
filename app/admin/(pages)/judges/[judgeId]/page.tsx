import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JudgeForm } from "@/components/judges/judge-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { getCountryComboboxOptions } from "@/lib/data/countries";
import { getProvinceComboboxOptions } from "@/lib/data/provinces";
import { getOrganizationsTree } from "@/lib/organizations";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { resolveAudit } from "@/lib/audit";
import { AuditInfo } from "@/components/common/audit-info";

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลกรรมการ – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลกรรมการที่ลงทะเบียนในระบบ",
};

type Props = { params: Promise<{ judgeId: string }> };

export default async function JudgeDetailPage(props: Readonly<Props>) {
  const { judgeId } = await props.params;

  const [judge, organizations] = await Promise.all([
    prisma.judge.findUnique({ where: { id: judgeId, deletedAt: null } }),
    getOrganizationsTree(),
  ]);
  if (!judge) notFound();

  const me = await getCurrentAdmin();
  if (!hasPermission(me, "judges", "view")) return <NoAccess />;

  const countryOptions = getCountryComboboxOptions();
  const provinceOptions = getProvinceComboboxOptions();
  const audit = await resolveAudit(judge);

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "กรรมการ", href: "/admin/judges" },
            { label: judge.name },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขข้อมูลกรรมการ
            </h1>
            <p className="mt-1 text-sm text-slate-600">ดูและอัปเดตข้อมูลกรรมการที่เลือก</p>
          </div>

          <Link href="/admin/judges">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <JudgeForm
          mode="edit"
          judgeId={judgeId}
          countryOptions={countryOptions}
          provinceOptions={provinceOptions}
          organizations={organizations}
          canEdit={hasPermission(me, "judges", "edit")}
          canDelete={hasPermission(me, "judges", "delete")}
          defaultValues={{
            prefix: judge.prefix ?? "",
            firstName: judge.firstName ?? judge.name,
            lastName: judge.lastName ?? "",
            country: judge.country,
            province: judge.province ?? "",
            organizationId: judge.organizationId ?? "",
            departmentId: judge.departmentId ?? "",
            status: judge.status,
            note: judge.note ?? "",
          }}
        />

        <AuditInfo {...audit} />
      </div>
    </main>
  );
}

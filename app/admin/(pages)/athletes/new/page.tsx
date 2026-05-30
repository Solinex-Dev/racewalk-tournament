import Link from "next/link";
import type { Metadata } from "next";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "เพิ่มนักกีฬาใหม่ – การแข่งขันเดินทน",
  description: "ฟอร์มเพิ่มข้อมูลนักกีฬาใหม่ ระบุชื่อ สังกัด และประเทศ",
};

export default async function NewAthletePage() {
  const affiliations = await prisma.affiliation.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "นักกีฬา", href: "/admin/athletes" },
            { label: "เพิ่มนักกีฬา" },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              เพิ่มนักกีฬาใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มเพิ่มข้อมูลนักกีฬาโดยระบุชื่อ สังกัด และประเทศ
            </p>
          </div>

          <Link href="/admin/athletes">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AthleteForm mode="create" affiliations={affiliations} />
      </div>
    </main>
  );
}

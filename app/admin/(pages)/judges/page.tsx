import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { JudgesList } from "@/components/judges/judges-list";
import { CsvImportButton } from "@/components/common/csv-import-button";
import { bulkImportJudges } from "@/app/actions/import";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "จัดการกรรมการ – การแข่งขันเดินทน",
  description:
    "หน้ารายการกรรมการทั้งหมดพร้อมลิงก์เข้าไปดู / แก้ไข และสร้างกรรมการใหม่",
};

export default async function JudgesPage() {
  const rows = await prisma.judge.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  const judges = rows.map((j) => {
    const spaceIdx = j.name.indexOf(" ");
    const first_name = spaceIdx >= 0 ? j.name.slice(0, spaceIdx) : j.name;
    const last_name = spaceIdx >= 0 ? j.name.slice(spaceIdx + 1) : "";
    return {
      id: j.id,
      first_name,
      last_name,
      country: j.country,
      province: j.province ?? "",
      department: j.department ?? "",
      organization: j.organization ?? "",
      note: j.note ?? "",
      status: "active" as const,
    };
  });

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
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

          <div className="flex flex-wrap items-end gap-2">
            <CsvImportButton
              label="Import CSV"
              hint="คอลัมน์: name (ชื่อกรรมการ)"
              importAction={bulkImportJudges}
            />
            <Link href="/admin/judges/new">
              <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                + เพิ่มกรรมการใหม่
              </Button>
            </Link>
          </div>
        </div>

        <JudgesList judges={judges} />
      </div>
    </main>
  );
}

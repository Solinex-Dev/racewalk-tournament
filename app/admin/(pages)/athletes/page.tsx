import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AthletesList } from "@/components/athletes/athletes-list";
import { CsvImportButton } from "@/components/common/csv-import-button";
import { bulkImportAthletes } from "@/app/actions/import";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "จัดการนักกีฬา – การแข่งขันเดินทน",
  description:
    "หน้ารายการนักกีฬาทั้งหมดพร้อมลิงก์เข้าไปดู / แก้ไข และสร้างนักกีฬาใหม่",
};

export default async function AthletesPage() {
  const rows = await prisma.athlete.findMany({
    where: { deletedAt: null },
    include: { affiliation: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const athletes = rows.map((a) => {
    const spaceIdx = a.name.indexOf(" ");
    const first_name = spaceIdx >= 0 ? a.name.slice(0, spaceIdx) : a.name;
    const last_name = spaceIdx >= 0 ? a.name.slice(spaceIdx + 1) : "";
    return {
      id: a.id,
      first_name,
      last_name,
      affiliation: a.affiliation?.name ?? "",
      country: a.country,
      province: "",
    };
  });

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
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

          <div className="flex flex-wrap items-end gap-2">
            <CsvImportButton
              label="Import CSV"
              hint="คอลัมน์: name, country, affiliation_name"
              importAction={bulkImportAthletes}
            />
            <Link href="/admin/athletes/new">
              <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                + เพิ่มนักกีฬาใหม่
              </Button>
            </Link>
          </div>
        </div>

        <AthletesList athletes={athletes} />
      </div>
    </main>
  );
}

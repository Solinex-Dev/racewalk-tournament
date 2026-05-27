import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลนักกีฬา – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลนักกีฬาที่ลงทะเบียนในระบบ",
};

type Props = { params: Promise<{ athleteId: string }> };

export default async function AthleteDetailPage(props: Props) {
  const { athleteId } = await props.params;

  const [athlete, affiliations] = await Promise.all([
    prisma.athlete.findUnique({
      where: { id: athleteId, deletedAt: null },
    }),
    prisma.affiliation.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!athlete) notFound();

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขข้อมูลนักกีฬา
            </h1>
            <p className="mt-1 text-sm text-slate-600">ดูและอัปเดตข้อมูลนักกีฬาที่เลือก</p>
          </div>

          <Link href="/admin/athletes">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AthleteForm
          mode="edit"
          athleteId={athleteId}
          affiliations={affiliations}
          defaultValues={{
            name: athlete.name,
            country: athlete.country,
            affiliationId: athlete.affiliationId ?? "",
            province: athlete.province ?? "",
            club: athlete.club ?? "",
            note: athlete.note ?? "",
          }}
        />
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลนักกีฬา – การแข่งขันเดินทน",
  description:
    "หน้าแก้ไขข้อมูลนักกีฬาที่ลงทะเบียนในระบบ Racewalk Tournament สำหรับอัปเดตสังกัด ประเทศ และหมายเหตุ.",
};

const MOCK_ATHLETE_BY_ID = {
  "ath-001": {
    first_name: "Somchai",
    last_name: "Rakdee",
    affiliation: "ชมรมเดินทนกรุงเทพฯ",
    country: "Thailand",
    province: "กรุงเทพมหานคร",
    note: "นักกีฬาทีมชาติ",
  },
  "ath-002": {
    first_name: "Jane",
    last_name: "Doe",
    affiliation: "Example Athletic Club",
    country: "USA",
    province: "California",
    note: "",
  },
};

type AthleteDetailPageProps = {
  params: Promise<{
    athleteId: string;
  }>;
};

export default async function AthleteDetailPage(
  props: AthleteDetailPageProps,
) {
  const { athleteId } = await props.params;

  const athlete =
    MOCK_ATHLETE_BY_ID[athleteId as keyof typeof MOCK_ATHLETE_BY_ID];

  if (!athlete) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขข้อมูลนักกีฬา
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูลนักกีฬาที่เลือก
            </p>
          </div>

          <Link href="/admin/athletes">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AthleteForm mode="edit" defaultValues={athlete} />
      </div>
    </main>
  );
}



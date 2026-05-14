import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoundForm, type RoundFormValues } from "@/components/rounds/round-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "แก้ไขรอบแข่ง – การแข่งขันเดินทน",
  description:
    "หน้าแก้ไขข้อมูลรอบแข่ง การแข่งขันเดินทนในระบบ Racewalk Tournament สำหรับอัปเดตรอบแข่ง นักกีฬา และกรรมการ.",
};

// TODO: ภายหลังให้ดึงจากฐานข้อมูลจริง
const MOCK_ROUND_BY_ID: Record<string, RoundFormValues> = {
  "rnd-001": {
    name: "รอบที่ 1 - ชาย 20 กม.",
    start_time: "08:00",
    status: "scheduled",
    max_athletes: "50",
    max_judges: "8",
    athletes: [
      { athlete_id: "ath-001", bib_no: "101" },
      { athlete_id: "ath-002", bib_no: "102" },
    ],
    judges: [
      {
        judge_id: "jud-001",
        table_no: "1",
        round_secret_code: "AB12CD",
        position: "head_judge",
      },
      {
        judge_id: "jud-002",
        table_no: "2",
        round_secret_code: "EF34GH",
        position: "judge",
      },
    ],
  },
  "rnd-002": {
    name: "รอบที่ 2 - หญิง 20 กม.",
    start_time: "14:00",
    status: "scheduled",
    max_athletes: "30",
    max_judges: "5",
    athletes: [{ athlete_id: "ath-003", bib_no: "201" }],
    judges: [
      {
        judge_id: "jud-003",
        table_no: "HEAD",
        round_secret_code: "JK56LM",
        position: "head_judge",
      },
    ],
  },
};

type RoundDetailPageProps = {
  params: Promise<{
    eventId: string;
    roundId: string;
  }>;
};

export default async function RoundDetailPage(props: RoundDetailPageProps) {
  const { eventId, roundId } = await props.params;

  const round = MOCK_ROUND_BY_ID[roundId];

  if (!round) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขรอบแข่ง: {round.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูลรอบแข่ง รวมถึงนักกีฬาและกรรมการ
            </p>
          </div>

          <Link href={`/admin/events/${eventId}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้า Event
            </Button>
          </Link>
        </div>

        <RoundForm mode="edit" eventId={eventId} defaultValues={round} />
      </div>
    </main>
  );
}


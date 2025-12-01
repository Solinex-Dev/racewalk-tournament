import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm, type EventFormValues } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "แก้ไข Event – Racewalk Tournament",
  description:
    "หน้าแก้ไขข้อมูล Event การแข่งขันเดินทนในระบบ Racewalk Tournament สำหรับอัปเดตวันที่ สถานที่ สถานะ และโค้ดสำหรับกรรมการ.",
};

const MOCK_EVENT_BY_ID: Record<string, EventFormValues> = {
  "evt-001": {
    name: "Racewalk Championship 2025",
    date: "2025-03-15",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "scheduled",
    note: "รายการหลักประจำปีของสมาคม",
    judge_join_code: "RW2025-A",
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
        event_secret_code: "AB12CD",
      },
      {
        judge_id: "jud-002",
        table_no: "2",
        event_secret_code: "EF34GH",
      },
    ],
  },
  "evt-002": {
    name: "Bangkok City Racewalk",
    date: "2025-01-20",
    location: "Bangkok City Route",
    distance_km: "10",
    status: "finished",
    note: "ใช้เส้นทางใจกลางเมือง",
    judge_join_code: "BKK-RW-10K",
    max_athletes: "30",
    max_judges: "5",
    athletes: [{ athlete_id: "ath-003", bib_no: "201" }],
    judges: [
      {
        judge_id: "jud-003",
        table_no: "HEAD",
        event_secret_code: "JK56LM",
      },
    ],
  },
};

type EventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventDetailPage(props: EventDetailPageProps) {
  const { eventId } = await props.params;

  const event = MOCK_EVENT_BY_ID[eventId];

  if (!event) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไข Event
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูล Event ที่เลือก รวมถึงสถานะและโค้ดสำหรับกรรมการ
            </p>
          </div>

          <Link href="/admin/events">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <EventForm mode="edit" defaultValues={event} />
      </div>
    </main>
  );
}



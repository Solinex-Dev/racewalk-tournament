import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm, type EventFormValues } from "@/components/events/event-form";
import { RoundsList, type Round } from "@/components/rounds/rounds-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "จัดการกิจกรรม – การแข่งขันเดินทน",
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
  },
  "evt-002": {
    name: "Bangkok City Racewalk",
    date: "2025-01-20",
    location: "Bangkok City Route",
    distance_km: "10",
    status: "finished",
    note: "ใช้เส้นทางใจกลางเมือง",
    judge_join_code: "BKK-RW-10K",
  },
};

// TODO: ภายหลังให้ดึงจากฐานข้อมูลจริง
const MOCK_ROUNDS_BY_EVENT: Record<string, Round[]> = {
  "evt-001": [
    {
      id: "rnd-001",
      name: "รอบที่ 1 - ชาย 20 กม.",
      start_time: "08:00",
      status: "scheduled",
      athlete_count: 25,
      judge_count: 6,
    },
    {
      id: "rnd-002",
      name: "รอบที่ 2 - หญิง 20 กม.",
      start_time: "14:00",
      status: "scheduled",
      athlete_count: 18,
      judge_count: 5,
    },
  ],
  "evt-002": [
    {
      id: "rnd-003",
      name: "รอบที่ 1 - 10 กม.",
      start_time: "07:00",
      status: "finished",
      athlete_count: 15,
      judge_count: 4,
    },
  ],
};

type EventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventDetailPage(props: EventDetailPageProps) {
  const { eventId } = await props.params;

  const event = MOCK_EVENT_BY_ID[eventId];
  const rounds = MOCK_ROUNDS_BY_EVENT[eventId] || [];

  if (!event) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการ Event: {event.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูล Event รวมถึงจัดการรอบแข่ง นักกีฬา และกรรมการ
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

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              ข้อมูลพื้นฐานของ Event
            </h2>
            <EventForm mode="edit" defaultValues={event} />
          </CardContent>
        </Card>

        <RoundsList eventId={eventId} rounds={rounds} />
      </div>
    </main>
  );
}



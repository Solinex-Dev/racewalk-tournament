import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Event moderator & judges config – Racewalk Tournament",
  description:
    "หน้าตั้งค่าผู้ดูแลและกรรมการสำหรับ Event ที่เลือก รวมถึงโค้ดสำหรับให้กรรมการ join เข้าร่วมการแข่งขัน.",
};

type EventModeratorPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventModeratorPage(
  props: EventModeratorPageProps,
) {
  const { eventId } = await props.params;

  // TODO: ภายหลังจะใช้ eventId ไปดึงข้อมูลกรรมการ / moderator จริงจากฐานข้อมูล

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              ตั้งค่า Moderator / กรรมการของ Event
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              จัดการสิทธิ์และโค้ดสำหรับให้กรรมการ join เข้าร่วม Event:{" "}
              <span className="font-mono text-xs text-slate-700">
                {eventId}
              </span>
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

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="space-y-4 p-6 text-sm text-slate-700">
            <p>
              หน้านี้เป็นโครงสำหรับการตั้งค่า Moderator / กรรมการของ Event
              เช่น การเลือกกรรมการจากรายการที่มีอยู่
              การกำหนดบทบาทเฉพาะจุดเช็คพอยต์ และการสร้าง/รีเซ็ตโค้ด join
              สำหรับกรรมการ
            </p>

            <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
              <p className="text-xs font-medium text-slate-700">
                ตัวอย่างที่วางแผนจะมีในหน้านี้:
              </p>
              <ul className="list-inside list-disc text-xs text-slate-600">
                <li>เลือกกรรมการที่รับผิดชอบแต่ละโซน / checkpoint</li>
                <li>ตั้งค่าโค้ด join สำหรับกรรมการ (ผูกกับ Event นี้)</li>
                <li>แสดงรายการกรรมการที่ join แล้วแบบ real-time</li>
              </ul>
            </div>

            <p className="text-[11px] text-slate-500">
              * ทั้งหมดในหน้านี้ยังเป็น placeholder –
              จะเชื่อมต่อกับระบบจัดการกรรมการและ Event จริงในเฟสถัดไป
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



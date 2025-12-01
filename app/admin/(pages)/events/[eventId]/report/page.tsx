import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Event report – Racewalk Tournament",
  description:
    "หน้าเตรียมข้อมูลสำหรับ Export รายงานผลการแข่งขันของ Event ที่เลือก ในระบบ Racewalk Tournament.",
};

type EventReportPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventReportPage(props: EventReportPageProps) {
  const { eventId } = await props.params;

  // TODO: ภายหลังจะใช้ eventId ไปดึงข้อมูลผลการแข่งขันจริง และเตรียมรูปแบบการ Export

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Event report
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              เตรียมข้อมูลสำหรับ Export รายงานผลการแข่งขันของ Event:{" "}
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
              หน้านี้เป็นโครงสำหรับฟีเจอร์ Export report ของ Event
              ในเวอร์ชันถัดไปจะเพิ่มการเลือกประเภทไฟล์ (เช่น CSV / Excel / PDF)
              และตัวเลือกฟิลด์ข้อมูลที่จะรวมในรายงาน
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 text-xs"
                disabled
              >
                ดาวน์โหลด CSV (กำลังพัฒนา)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 text-xs"
                disabled
              >
                ดาวน์โหลด Excel (กำลังพัฒนา)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 text-xs"
                disabled
              >
                ดาวน์โหลด PDF (กำลังพัฒนา)
              </Button>
            </div>

            <p className="text-[11px] text-slate-500">
              * ปุ่มทั้งหมดด้านบนยังเป็น placeholder – จะเชื่อมต่อกับระบบ
              Export และผลการแข่งขันจริงภายหลัง
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



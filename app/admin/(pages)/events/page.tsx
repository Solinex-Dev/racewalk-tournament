import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

type AdminEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
  isCurrent?: boolean;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_EVENTS: AdminEvent[] = [
  {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    date: "2025-03-15",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "ongoing",
    isCurrent: true,
  },
  {
    id: "evt-002",
    name: "Bangkok City Racewalk",
    date: "2025-01-20",
    location: "Bangkok City Route",
    distance_km: "10",
    status: "finished",
  },
];

export const metadata: Metadata = {
  title: "จัดการ Event – Racewalk Tournament",
  description:
    "หน้ารายการ Event ทั้งหมดในระบบจัดการการแข่งขันเดินทน Racewalk Tournament.",
};

const STATUS_LABEL: Record<AdminEvent["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  finished: "Finished",
};

export default function EventsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการ Event
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการ Event ทั้งหมดที่ถูกสร้างในระบบ
              พร้อมสถานะและข้อมูลเบื้องต้นของการแข่งขัน
            </p>
          </div>

          <Link href="/admin/events/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + สร้าง Event ใหม่
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ชื่อ Event</th>
                    <th className="px-4 py-3 text-left">วันที่แข่งขัน</th>
                    <th className="px-4 py-3 text-left">สถานที่</th>
                    <th className="px-4 py-3 text-left">ระยะทาง (กม.)</th>
                    <th className="px-4 py-3 text-left">สถานะ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {MOCK_EVENTS.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{event.name}</span>
                          {event.isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Current event
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {event.date}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {event.location || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {event.distance_km || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {STATUS_LABEL[event.status]}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                        {event.isCurrent && (
                            <Link href={`/events/${event.id}`} target="_blank">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-emerald-300 bg-emerald-500/10 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20"
                              >
                                <span>Open event page</span>
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/admin/events/${event.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-slate-200 text-xs"
                            >
                              รายละเอียด / แก้ไข
                            </Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/report`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-slate-200 text-xs"
                            >
                              Report
                            </Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/moderator`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              Moderator
                            </Button>
                          </Link>
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
              * ข้อมูลในตารางนี้เป็นตัวอย่างเบื้องต้น – จะเชื่อมต่อฐานข้อมูล
              และเพิ่มระบบค้นหา/กรอง Event ภายหลัง
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



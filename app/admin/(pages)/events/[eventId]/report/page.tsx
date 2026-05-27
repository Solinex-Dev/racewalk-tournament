import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "รายงานกิจกรรม – การแข่งขันเดินทน",
  description: "Export รายงานผลการแข่งขันเป็น CSV หรือ PDF",
};

type Props = { params: Promise<{ eventId: string }> };

function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default async function EventReportPage(props: Props) {
  const { eventId } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: {
          _count: {
            select: {
              roundAthletes: { where: { deletedAt: null } },
              finishTimes: { where: { deletedAt: null } },
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Export รายงาน
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดาวน์โหลดผลการแข่งขันของ <span className="font-medium">{event.name}</span>
            </p>
          </div>

          <Link href={`/admin/events/${eventId}`}>
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้า Event
            </Button>
          </Link>
        </div>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-slate-900">ทั้ง Event (รวมทุกรอบ)</h2>
            <p className="text-sm text-slate-600">
              ดาวน์โหลดผลรวมทุกรอบในไฟล์เดียว — เหมาะสำหรับการเก็บเป็นบันทึกหรือส่งให้สมาคม
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/events/${eventId}/export`} download>
                <Button size="sm" className="rounded-lg text-sm">
                  ⬇ ดาวน์โหลด CSV
                </Button>
              </a>
              <Link
                href={`/admin/events/${eventId}/report/print`}
                target="_blank"
                rel="noopener"
              >
                <Button variant="outline" size="sm" className="rounded-lg text-sm">
                  🖨️ Print / Save as PDF
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-slate-500">
              CSV เปิดได้ใน Excel โดยตรง • PDF ผ่านหน้า Print (Ctrl+P → Save as PDF)
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-slate-900">รายรอบ</h2>
            <p className="text-sm text-slate-600">
              ดาวน์โหลดเฉพาะรอบที่ต้องการ
            </p>

            {event.rounds.length === 0 ? (
              <p className="text-sm italic text-slate-500">Event นี้ยังไม่มีรอบ</p>
            ) : (
              <div className="space-y-2">
                {event.rounds.map((round) => (
                  <div
                    key={round.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">{round.name}</p>
                      <p className="text-xs text-slate-600">
                        {round.status} • {round._count.roundAthletes} นักกีฬา •{" "}
                        {round._count.finishTimes} เข้าเส้นชัย
                        {round.endedAt && round.startedAt && (
                          <> • เวลา {formatMs(round.endedAt.getTime() - round.startedAt.getTime())}</>
                        )}
                      </p>
                    </div>
                    <a
                      href={`/api/events/${eventId}/export?round=${round.id}`}
                      download
                    >
                      <Button variant="outline" size="sm" className="rounded-lg text-xs">
                        ⬇ CSV รอบนี้
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

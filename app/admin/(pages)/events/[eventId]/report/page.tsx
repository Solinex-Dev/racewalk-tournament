import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "รายงานกิจกรรม – การแข่งขันเดินทน",
  description: "Export รายงานผลการแข่งขันเป็น Excel หรือ PDF ในรูปแบบเอกสารการแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const ROUND_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังแข่งขัน",
  FINISHED: "เสร็จสิ้น",
};

export default async function EventReportPage(props: Readonly<Props>) {
  const { eventId } = await props.params;

  const me = await getCurrentAdmin();
  if (!hasPermission(me, "reports", "view")) return <NoAccess />;

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
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: event.name, href: `/admin/events/${eventId}` },
            { label: "รายงานผล" },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Export รายงาน</h1>
            <p className="mt-1 text-sm text-slate-600">
              ดาวน์โหลดผลการแข่งขันของ <span className="font-medium">{event.name}</span>
            </p>
          </div>

          <Link href={`/admin/events/${eventId}`}>
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              <ArrowLeft className="h-4 w-4" /> กลับไปหน้า Event
            </Button>
          </Link>
        </div>

        {/* ── Official Race Walking Judges Summary Sheet ───────────────────── */}
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40">
          <CardContent className="space-y-4 p-6">
            <div>
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                รูปแบบเอกสารการแข่งขัน
              </span>
              <h2 className="mt-2 text-base font-semibold text-slate-900">
                ใบสรุปผลการตัดสินกรรมการ (Race Walking Judges Summary Sheet)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                เอกสารตามรูปแบบมาตรฐานการแข่งขันเดินทน — แสดงใบเหลือง/ใบแดง (~ ยกเท้า, &lt; เข่างอ)
                ของกรรมการแต่ละโซน พร้อมยอดรวม การตัดสิทธิ์ (DQ) และเวลาเข้าเส้นชัย{" "}
                <span className="text-slate-500">— Excel แยกชีตต่อรอบ (1 รอบ = 1 ชีต)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/events/${eventId}/summary-xlsx`} download>
                <Button size="sm" className="rounded-lg bg-emerald-700 text-sm hover:bg-emerald-800">
                  <Download className="size-4" aria-hidden />
                  ดาวน์โหลด Excel (.xlsx)
                </Button>
              </a>
              <Link href={`/admin/events/${eventId}/report/summary`} target="_blank" rel="noopener">
                <Button variant="outline" size="sm" className="rounded-lg border-emerald-300 text-sm">
                  <Printer className="size-4" aria-hidden />
                  พิมพ์ / บันทึก PDF
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ── Per-round downloads ──────────────────────────────────────────── */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">รายรอบ</h2>
              <p className="mt-1 text-sm text-slate-600">ดาวน์โหลดเฉพาะรอบที่ต้องการ</p>
            </div>

            {event.rounds.length === 0 ? (
              <p className="text-sm italic text-slate-500">Event นี้ยังไม่มีรอบ</p>
            ) : (
              <div className="space-y-2">
                {event.rounds.map((round) => (
                  <div
                    key={round.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">{round.name}</p>
                      <p className="text-xs text-slate-600">
                        {ROUND_STATUS_LABEL[round.status] ?? round.status} •{" "}
                        {round._count.roundAthletes} นักกีฬา • {round._count.finishTimes} เข้าเส้นชัย
                        {round.endedAt && round.startedAt && (
                          <> • เวลา {formatMs(round.endedAt.getTime() - round.startedAt.getTime())}</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/api/events/${eventId}/summary-xlsx?round=${round.id}`} download>
                        <Button variant="outline" size="sm" className="rounded-lg text-xs">
                          <Download className="size-3.5" aria-hidden />
                          Excel
                        </Button>
                      </a>
                      <Link
                        href={`/admin/events/${eventId}/report/summary?round=${round.id}`}
                        target="_blank"
                        rel="noopener"
                      >
                        <Button variant="outline" size="sm" className="rounded-lg text-xs">
                          <Printer className="size-3.5" aria-hidden />
                          PDF
                        </Button>
                      </Link>
                      <a href={`/api/events/${eventId}/export?round=${round.id}`} download>
                        <Button variant="ghost" size="sm" className="rounded-lg text-xs text-slate-500">
                          CSV
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Plain results table (simple CSV / print) ─────────────────────── */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">ตารางผลแบบย่อ (CSV)</h2>
              <p className="mt-1 text-sm text-slate-600">
                สรุปผลรวมทุกรอบแบบตารางอย่างง่าย เหมาะกับการเปิดใน Excel หรือเก็บเป็นบันทึก
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/events/${eventId}/export`} download>
                <Button variant="outline" size="sm" className="rounded-lg text-sm">
                  <Download className="size-4" aria-hidden />
                  ดาวน์โหลด CSV (รวมทุกรอบ)
                </Button>
              </a>
              <Link href={`/admin/events/${eventId}/report/print`} target="_blank" rel="noopener">
                <Button variant="ghost" size="sm" className="rounded-lg text-sm text-slate-500">
                  <Printer className="size-4" aria-hidden />
                  พิมพ์ตารางย่อ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

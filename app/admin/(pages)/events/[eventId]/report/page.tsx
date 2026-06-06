import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { bibAgeStart, ageGroupLabel } from "@/lib/bib";
import {
  ReportDownloads,
  type ReportAgeGroup,
  type ReportRound,
} from "@/components/report/report-downloads";

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

  const [event, eventAthletes] = await Promise.all([
    prisma.event.findUnique({
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
    }),
    prisma.eventAthlete.findMany({
      where: { eventId, deletedAt: null },
      select: { bib: true },
    }),
  ]);

  if (!event) notFound();

  // Available age groups (from BIBs) with how many athletes fall in each band.
  const ageGroupCounts = new Map<number, number>();
  for (const ea of eventAthletes) {
    const start = bibAgeStart(ea.bib);
    if (start !== null) ageGroupCounts.set(start, (ageGroupCounts.get(start) ?? 0) + 1);
  }
  const ageGroups: ReportAgeGroup[] = [...ageGroupCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, count]) => ({ value, label: ageGroupLabel(value), count }));

  const rounds: ReportRound[] = event.rounds.map((round) => ({
    id: round.id,
    name: round.name,
    statusLabel: ROUND_STATUS_LABEL[round.status] ?? round.status,
    // Only finished rounds can be exported.
    exportable: round.status === "FINISHED",
    athleteCount: round._count.roundAthletes,
    finishCount: round._count.finishTimes,
    elapsedLabel:
      round.endedAt && round.startedAt
        ? formatMs(round.endedAt.getTime() - round.startedAt.getTime())
        : null,
  }));

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

        <ReportDownloads eventId={eventId} ageGroups={ageGroups} rounds={rounds} />
      </div>
    </main>
  );
}

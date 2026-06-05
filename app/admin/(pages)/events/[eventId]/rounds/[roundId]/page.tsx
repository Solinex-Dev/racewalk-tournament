import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoundForm, type RoundFormValues } from "@/components/rounds/round-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import type { EventAthleteOption } from "@/types/event-athlete";
import { metersFromKm } from "@/lib/distance";

export const metadata: Metadata = {
  title: "แก้ไขรอบแข่ง – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลรอบแข่งการแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string; roundId: string }> };

function toDatetimeLocal(dt: Date) {
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function toDateInput(dt: Date) {
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default async function RoundDetailPage(props: Readonly<Props>) {
  const { eventId, roundId } = await props.params;

  const [round, rawEventAthletes, judges] = await Promise.all([
    prisma.round.findUnique({
      where: { id: roundId, deletedAt: null },
      include: {
        event: { select: { name: true, date: true } },
        roundAthletes: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        roundOfficials: { where: { deletedAt: null } },
      },
    }),
    prisma.eventAthlete.findMany({
      where: { eventId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { bib: "asc" }],
      select: { athleteId: true, bib: true, athlete: { select: { name: true } } },
    }),
    prisma.judge.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!round) notFound();

  const eventAthletes: EventAthleteOption[] = rawEventAthletes.map((ea) => ({
    athleteId: ea.athleteId,
    athleteName: ea.athlete.name,
    bib: ea.bib,
  }));

  const defaultValues: RoundFormValues = {
    name: round.name,
    scheduledTime: round.scheduledTime ? toDatetimeLocal(round.scheduledTime) : "",
    expectedEndTime: round.expectedEndTime ? toDatetimeLocal(round.expectedEndTime) : "",
    distanceMeters: metersFromKm(round.distanceKm),
    lapCount: round.lapCount ?? 1,
    note: round.note ?? "",
    status: round.status,
    athletes: round.roundAthletes.map((ra) => ({
      athleteId: ra.athleteId,
    })),
    officials: round.roundOfficials.map((ro) => ({
      judgeId: ro.judgeId,
      zone: ro.zone ?? "",
      secretCode: ro.secretCode,
      position: ro.position,
    })),
  };

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: round.event.name, href: `/admin/events/${eventId}` },
            { label: round.name },
          ]}
        />
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
              <ArrowLeft className="h-4 w-4" /> กลับไปหน้า Event
            </Button>
          </Link>
        </div>

        <RoundForm
          mode="edit"
          eventId={eventId}
          roundId={roundId}
          eventAthletes={eventAthletes}
          judgeOptions={judges}
          eventDate={toDateInput(round.event.date)}
          defaultValues={defaultValues}
        />
      </div>
    </main>
  );
}

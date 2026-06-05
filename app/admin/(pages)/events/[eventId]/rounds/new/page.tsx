import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoundForm } from "@/components/rounds/round-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import type { EventAthleteOption } from "@/types/event-athlete";
import { metersFromKm } from "@/lib/distance";

export const metadata: Metadata = {
  title: "สร้างรอบแข่งใหม่ – การแข่งขันเดินทน",
  description: "ฟอร์มสร้างรอบแข่งใหม่ใน Event การแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

/** Format a stored Date to a yyyy-mm-dd calendar day (local wall-clock). */
function toDateInput(dt: Date) {
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default async function NewRoundPage(props: Readonly<Props>) {
  const { eventId } = await props.params;

  const [event, rawEventAthletes, judges] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { name: true, lapCount: true, distanceKm: true, date: true, status: true },
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

  const eventAthletes: EventAthleteOption[] = rawEventAthletes.map((ea) => ({
    athleteId: ea.athleteId,
    athleteName: ea.athlete.name,
    bib: ea.bib,
  }));

  // A finished event accepts no new rounds — backstop for direct navigation
  // (the "create round" buttons are already hidden on the event page).
  if (event?.status === "FINISHED") {
    redirect(`/admin/events/${eventId}`);
  }

  // Pre-fill lapCount and distance (metres) from event so admin doesn't retype
  const roundDefaults = {
    lapCount: event?.lapCount ?? 1,
    distanceMeters: metersFromKm(event?.distanceKm),
  };

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: event?.name ?? "Event", href: `/admin/events/${eventId}` },
            { label: "สร้างรอบใหม่" },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              สร้างรอบแข่งใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มสร้างรอบแข่งใหม่ใน Event นี้
              เพื่อเพิ่มนักกีฬาและกรรมการสำหรับรอบนี้
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
          mode="create"
          eventId={eventId}
          eventAthletes={eventAthletes}
          judgeOptions={judges}
          eventDate={event ? toDateInput(event.date) : undefined}
          defaultValues={roundDefaults}
        />
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm, type EventFormValues } from "@/components/events/event-form";
import { RoundsList, type Round } from "@/components/rounds/rounds-list";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { resolveAudit } from "@/lib/audit";
import { AuditInfo } from "@/components/common/audit-info";

export const metadata: Metadata = {
  title: "จัดการกิจกรรม – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูล Event การแข่งขันเดินทนในระบบ Racewalk Tournament",
};

type Props = { params: Promise<{ eventId: string }> };

function toDateInput(dt: Date) {
  return dt.toISOString().slice(0, 10);
}

export default async function EventDetailPage(props: Props) {
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
              roundOfficials: { where: { deletedAt: null } },
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const me = await getCurrentAdmin();
  if (!hasPermission(me, "events", "view")) return <NoAccess />;

  const audit = await resolveAudit(event);

  const eventValues: EventFormValues = {
    name: event.name,
    date: toDateInput(event.date),
    location: event.location,
    distanceKm: event.distanceKm,
    lapCount: event.lapCount,
    status: event.status,
  };

  const rounds: Round[] = event.rounds.map((r) => ({
    id: r.id,
    name: r.name,
    start_time: r.scheduledTime
      ? r.scheduledTime.toTimeString().slice(0, 5)
      : undefined,
    status: r.status.toLowerCase() as Round["status"],
    athlete_count: r._count.roundAthletes,
    judge_count: r._count.roundOfficials,
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: event.name },
          ]}
        />
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

        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            ข้อมูลพื้นฐานของ Event
          </h2>
          <EventForm
            mode="edit"
            eventId={eventId}
            canEdit={hasPermission(me, "events", "edit")}
            defaultValues={eventValues}
          />
          <div className="mt-3">
            <AuditInfo {...audit} />
          </div>
        </div>

        <RoundsList eventId={eventId} rounds={rounds} />
      </div>
    </main>
  );
}

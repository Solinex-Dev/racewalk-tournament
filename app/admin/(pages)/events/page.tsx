import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { EventsList } from "@/components/events/events-list";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { canAccessResource, hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "จัดการกิจกรรม – การแข่งขันเดินทน",
  description:
    "หน้ารายการกิจกรรมทั้งหมดในระบบจัดการการแข่งขันเดินทน",
};

export default async function EventsPage() {
  const me = await getCurrentAdmin();
  if (!canAccessResource(me, "events")) return <NoAccess />;

  const rows = await prisma.event.findMany({
    where: { deletedAt: null },
    orderBy: { date: "desc" },
  });

  const events = rows.map((e) => ({
    id: e.id,
    name: e.name,
    date: e.date.toISOString().slice(0, 10),
    location: e.location,
    distance_km: e.distanceKm,
    status: e.status.toLowerCase() as "draft" | "scheduled" | "ongoing" | "finished",
    isCurrent: e.isCurrent,
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb items={[{ label: "แดชบอร์ด", href: "/admin" }, { label: "Events" }]} />
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

          {hasPermission(me, "events", "create") && (
            <Link href="/admin/events/new">
              <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                + สร้าง Event ใหม่
              </Button>
            </Link>
          )}
        </div>

        <EventsList events={events} canModerate={hasPermission(me, "events", "edit")} />
      </div>
    </main>
  );
}

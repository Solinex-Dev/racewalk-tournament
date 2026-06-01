import Link from "next/link";
import type { Metadata } from "next";
import type { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";

// Reflect live ONGOING status without serving a stale cached dashboard.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ภาพรวมผู้ดูแลระบบ – การแข่งขันเดินทน",
  description:
    "หน้าแดชบอร์ดภาพรวมสำหรับผู้ดูแลระบบ Racewalk Tournament แสดงสถานะ Event ปัจจุบัน, กรรมการ และนักกีฬา.",
};

const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "ร่าง",
  SCHEDULED: "กำหนดการ",
  ONGOING: "กำลังดำเนินการ",
  FINISHED: "เสร็จสิ้น",
};

const STATUS_BADGE_CLASS: Record<EventStatus, string> = {
  DRAFT: "bg-slate-500",
  SCHEDULED: "bg-blue-600",
  ONGOING: "bg-emerald-600",
  FINISHED: "bg-slate-400",
};

function countUniqueIds(ids: string[]): number {
  return new Set(ids).size;
}

export default async function AdminDashboardPage() {
  const me = await getCurrentAdmin();
  const canModerate = hasPermission(me, "moderator", "view");

  const [eventsTotal, judgesTotal, athletesTotal, ongoingRows] =
    await Promise.all([
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.judge.count({ where: { deletedAt: null } }),
      prisma.athlete.count({ where: { deletedAt: null } }),
      // "กิจกรรมปัจจุบัน" = events actually ONGOING right now (can be more than one).
      // The manual isCurrent flag is intentionally NOT used here — a finished event
      // that still has isCurrent=true must not appear as a current activity.
      prisma.event.findMany({
        where: { deletedAt: null, status: "ONGOING" },
        orderBy: { date: "desc" },
        include: {
          rounds: {
            where: { deletedAt: null },
            include: {
              roundAthletes: {
                where: { deletedAt: null },
                select: { athleteId: true },
              },
              roundOfficials: {
                where: { deletedAt: null },
                select: { judgeId: true },
              },
            },
          },
        },
      }),
    ]);

  const ongoingEvents = ongoingRows.map((ev) => ({
    id: ev.id,
    name: ev.name,
    date: ev.date.toISOString().slice(0, 10),
    location: ev.location,
    status: ev.status,
    athletesCount: countUniqueIds(
      ev.rounds.flatMap((r) => r.roundAthletes.map((ra) => ra.athleteId)),
    ),
    judgesCount: countUniqueIds(
      ev.rounds.flatMap((r) => r.roundOfficials.map((ro) => ro.judgeId)),
    ),
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="max-w-full space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            ภาพรวมผู้ดูแลระบบ
          </h1>
          <p className="max-w-xl text-sm text-slate-600">
            ภาพรวมการจัดการแข่งขันเดินทน – ดูสถานะกิจกรรม,
            กรรมการ และนักกีฬาในระบบจากหน้านี้
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              กิจกรรม
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {eventsTotal}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวน Event ทั้งหมดในระบบ
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              กรรมการ
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {judgesTotal}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวนกรรมการที่ลงทะเบียนในระบบ
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">
              นักกีฬา
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {athletesTotal}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              จำนวนรายชื่อนักกีฬาทั้งหมด
            </p>
          </div>
        </section>

        {/* "กิจกรรมปัจจุบัน" section — shown only when at least one event is ONGOING.
            Renders one card per ongoing event (supports multiple simultaneous races). */}
        {ongoingEvents.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                กิจกรรมที่กำลังดำเนินการ
              </h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                {ongoingEvents.length} รายการ
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ongoingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 text-sm text-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{ev.name}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white ${STATUS_BADGE_CLASS[ev.status]}`}
                      >
                        {STATUS_LABEL[ev.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      วันที่แข่งขัน <span className="font-medium">{ev.date}</span> ที่{" "}
                      <span className="font-medium">{ev.location}</span>
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                      <div className="rounded-xl bg-white/60 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase text-slate-500">
                          นักกีฬาในกิจกรรม
                        </p>
                        <p className="mt-1 text-sm font-semibold">{ev.athletesCount}</p>
                      </div>
                      <div className="rounded-xl bg-white/60 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase text-slate-500">
                          กรรมการในกิจกรรม
                        </p>
                        <p className="mt-1 text-sm font-semibold">{ev.judgesCount}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 text-xs">
                      {canModerate && (
                        <Link
                          href={`/admin/events/${ev.id}/moderator`}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Moderator
                        </Link>
                      )}
                      <Link
                        href={`/events/${ev.id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                      >
                        เปิดหน้า Live
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-900">
              ขณะนี้ไม่มีกิจกรรมที่กำลังดำเนินการ
            </p>
            <p className="mt-1 text-xs text-slate-500">
              เริ่มการแข่งขันได้จากหน้า Moderator ของแต่ละ Event
            </p>
            <Link
              href="/admin/events"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              ไปจัดการ Event
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

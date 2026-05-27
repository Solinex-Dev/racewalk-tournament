import Link from "next/link";
import type { Metadata } from "next";
import type { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  const [eventsTotal, judgesTotal, athletesTotal, currentEventRow] =
    await Promise.all([
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.judge.count({ where: { deletedAt: null } }),
      prisma.athlete.count({ where: { deletedAt: null } }),
      prisma.event.findFirst({
        where: {
          deletedAt: null,
          OR: [{ isCurrent: true }, { status: "ONGOING" }],
        },
        orderBy: [{ isCurrent: "desc" }, { date: "desc" }],
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

  const currentEvent = currentEventRow
    ? {
        id: currentEventRow.id,
        name: currentEventRow.name,
        date: currentEventRow.date.toISOString().slice(0, 10),
        location: currentEventRow.location,
        status: currentEventRow.status,
        athletesCount: countUniqueIds(
          currentEventRow.rounds.flatMap((r) =>
            r.roundAthletes.map((ra) => ra.athleteId),
          ),
        ),
        judgesCount: countUniqueIds(
          currentEventRow.rounds.flatMap((r) =>
            r.roundOfficials.map((ro) => ro.judgeId),
          ),
        ),
      }
    : null;

  const currentEventCardClass =
    currentEvent?.status === "ONGOING"
      ? "border-emerald-200 bg-emerald-50/70"
      : "border-slate-200 bg-white";

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

        <section className="grid gap-4 lg:grid-cols-[2fr,1.3fr]">
          <div className="space-y-4">
            {currentEvent ? (
              <div
                className={`rounded-2xl border p-4 shadow-sm ${currentEventCardClass}`}
              >
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    currentEvent.status === "ONGOING"
                      ? "text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  กิจกรรมปัจจุบัน
                </p>
                <div className="mt-2 flex flex-col gap-2 text-sm text-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{currentEvent.name}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white ${STATUS_BADGE_CLASS[currentEvent.status]}`}
                    >
                      {STATUS_LABEL[currentEvent.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    วันที่แข่งขัน{" "}
                    <span className="font-medium">{currentEvent.date}</span> ที่{" "}
                    <span className="font-medium">{currentEvent.location}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="rounded-xl bg-white/60 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase text-slate-500">
                        นักกีฬาในกิจกรรม
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {currentEvent.athletesCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/60 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase text-slate-500">
                        กรรมการในกิจกรรม
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {currentEvent.judgesCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <Link
                      href={`/admin/events/${currentEvent.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      ไปหน้า Event นี้
                    </Link>
                    <Link
                      href={`/events/${currentEvent.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                    >
                      เปิดหน้า Live / Public
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-900">
                  ยังไม่มีกิจกรรมปัจจุบัน
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  ตั้ง Event เป็น &quot;กิจกรรมปัจจุบัน&quot; (isCurrent)
                  หรือสถานะกำลังดำเนินการ
                </p>
                <Link
                  href="/admin/events"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  ไปจัดการ Event
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

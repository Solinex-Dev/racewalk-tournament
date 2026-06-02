import Link from "next/link";
import type { Metadata } from "next";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { LiveTimer } from "@/components/common/live-timer";
import { Logo } from "@/components/partials/admin-sidebar/logo";
import { prisma } from "@/lib/prisma";

// Landing page reflects live race state — render at request time and let the
// client poll so newly-started / finished events appear without a hard reload.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "การแข่งขันเดินทน | Racewalk Tournament",
  description:
    "หน้าหลักของ Racewalk Tournament — ติดตามการแข่งขันเดินทนที่กำลังดำเนินอยู่แบบเรียลไทม์ เลือกเปิดกระดานคะแนนสดของแต่ละรายการได้ทันที",
};

function formatThaiDate(dt: Date) {
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatThaiDateTime(dt: Date) {
  return dt.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Most relevant round to surface: ONGOING → next SCHEDULED → last FINISHED. */
function pickFeatureRound<T extends { status: string }>(rounds: T[]): T | null {
  return (
    rounds.find((r) => r.status === "ONGOING") ??
    rounds.find((r) => r.status === "SCHEDULED") ??
    [...rounds].reverse().find((r) => r.status === "FINISHED") ??
    rounds[0] ??
    null
  );
}

type EventStatus = "ONGOING" | "SCHEDULED" | "FINISHED";

type EventVM = {
  id: string;
  name: string;
  location: string;
  dateLabel: string;
  distanceKm: string;
  status: EventStatus;
  roundCount: number;
  athleteCount: number;
  round: {
    name: string;
    heatName: string | null;
    lapCount: number;
    currentLap: number;
    startedAtIso: string | null;
    endedAtIso: string | null;
    scheduledLabel: string | null;
  } | null;
};

export default async function Home() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null, status: { not: "DRAFT" } },
    orderBy: { date: "desc" },
    include: {
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: { roundAthletes: { where: { deletedAt: null }, select: { id: true } } },
      },
    },
  });

  const toVM = (e: (typeof events)[number]): EventVM => {
    const fr = pickFeatureRound(e.rounds);
    return {
      id: e.id,
      name: e.name,
      location: e.location,
      dateLabel: formatThaiDate(e.date),
      distanceKm: e.distanceKm,
      status: e.status as EventStatus,
      roundCount: e.rounds.length,
      athleteCount: fr?.roundAthletes.length ?? 0,
      round: fr
        ? {
            name: fr.name,
            heatName: fr.heatName,
            lapCount: fr.lapCount ?? 0,
            currentLap: fr.currentLap,
            startedAtIso: fr.startedAt ? fr.startedAt.toISOString() : null,
            endedAtIso: fr.endedAt ? fr.endedAt.toISOString() : null,
            scheduledLabel: fr.scheduledTime ? formatThaiDateTime(fr.scheduledTime) : null,
          }
        : null,
    };
  };

  const ongoing = events.filter((e) => e.status === "ONGOING").map(toVM);
  const scheduled = events.filter((e) => e.status === "SCHEDULED").map(toVM);
  const finished = events
    .filter((e) => e.status === "FINISHED")
    .map(toVM)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <AutoRefresh intervalMs={15000} />

      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9 shrink-0 invert" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">การแข่งขันเดินทน</span>
              <span className="text-[11px] text-slate-400">
                Live scoreboard · ระบบตัดสินบนคลาวด์
              </span>
            </div>
          </div>

          <Link
            href="/admin/login"
            className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            เข้าสู่ระบบผู้จัดงาน
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-8 shadow-xl shadow-sky-500/10 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>
          <div className="relative max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-100 backdrop-blur">
              {ongoing.length > 0 ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  มี {ongoing.length} รายการกำลังแข่งขันสด
                </>
              ) : (
                <>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" />
                  ระบบกระดานคะแนนสด
                </>
              )}
            </div>

            <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl lg:text-4xl">
              ติดตามการแข่งขันเดินทนแบบเรียลไทม์
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-slate-300">
              ดูอันดับนักกีฬา เวลา Lap ล่าสุด และใบเตือนของทุกสนามที่กำลังแข่งขัน
              เลือกรายการด้านล่างเพื่อเปิดกระดานคะแนนสด
            </p>
          </div>
        </section>

        {/* Live now */}
        <section className="mt-10">
          <SectionHeading title="กำลังแข่งขันสด" count={ongoing.length} dotClass="bg-emerald-400" pulse />
          {ongoing.length > 0 ? (
            <div className="grid gap-5">
              {ongoing.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-12 text-center">
              <p className="text-sm text-slate-400">ขณะนี้ยังไม่มีการแข่งขันที่กำลังดำเนินอยู่</p>
              <p className="mt-1 text-xs text-slate-500">
                เมื่อมีการเริ่มการแข่งขัน รายการจะแสดงที่นี่โดยอัตโนมัติ
              </p>
            </div>
          )}
        </section>

        {/* Upcoming */}
        {scheduled.length > 0 && (
          <section className="mt-10">
            <SectionHeading title="รายการที่กำลังจะมาถึง" count={scheduled.length} dotClass="bg-sky-400" />
            <div className="grid gap-5">
              {scheduled.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {/* Recent results */}
        {finished.length > 0 && (
          <section className="mt-10">
            <SectionHeading title="ผลการแข่งขันล่าสุด" count={finished.length} dotClass="bg-slate-400" />
            <div className="grid gap-5">
              {finished.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {/* About — collapsed accordion, racewalk info only */}
        <section className="mt-12">
          <details className="group rounded-3xl border border-slate-800 bg-slate-950/70 shadow-lg shadow-slate-900/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
                  เกี่ยวกับการแข่งขันเดินทน (Racewalk)
                </h2>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  ทำความรู้จักกีฬาเดินทนและกติกาหลักโดยย่อ
                </p>
              </div>
              <svg
                className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="space-y-4 border-t border-slate-800 p-5 sm:p-6">
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-slate-50">Racewalk คืออะไร</h3>
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  การแข่งขันเดินทน (Racewalk) เป็นกีฬากรีฑาประเภทเดินที่มีกติกาชัดเจนเรื่องการ
                  “เดินไม่วิ่ง” โดยนักกีฬาต้องรักษาเทคนิคการเดินที่ถูกต้องตลอดระยะทาง
                  หากผิดกติกาจะถูกกรรมการให้ใบเตือนและอาจถูกตัดสิทธิ์ได้
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <h3 className="text-sm font-semibold text-amber-300">การสัมผัสพื้น (Loss of contact)</h3>
                  <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                    ต้องมีเท้าข้างหนึ่งสัมผัสพื้นตลอดเวลาตามสายตากรรมการ ห้ามลอยตัวทั้งสองเท้าพร้อมกัน
                  </p>
                </div>
                <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <h3 className="text-sm font-semibold text-amber-300">เข่าเหยียดตรง (Bent knee)</h3>
                  <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                    ขาที่ก้าวไปข้างหน้าต้องเหยียดตรง (ไม่งอเข่า) ตั้งแต่เท้าแตะพื้นจนผ่านแนวดิ่งของลำตัว
                  </p>
                </div>
              </div>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({
  title,
  count,
  dotClass,
  pulse = false,
}: {
  title: string;
  count: number;
  dotClass: string;
  pulse?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotClass} opacity-75`} />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">{title}</h2>
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
        {count}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  if (status === "ONGOING") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        กำลังแข่งขันสด
      </span>
    );
  }
  if (status === "SCHEDULED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        กำลังจะเริ่ม
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      จบการแข่งขันแล้ว
    </span>
  );
}

function EventCard({ event }: { event: EventVM }) {
  const isLive = event.status === "ONGOING";
  const r = event.round;
  const pct =
    r && r.lapCount > 0 ? Math.min(100, Math.round((r.currentLap / r.lapCount) * 100)) : 0;

  const accent = isLive
    ? {
        ring: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
        glow: "bg-emerald-500/10",
        cta: "bg-emerald-500 text-slate-950 group-hover:bg-emerald-400",
        ctaLabel: "ดู Leaderboard",
      }
    : event.status === "SCHEDULED"
      ? {
          ring: "hover:border-sky-500/40 hover:shadow-sky-500/10",
          glow: "bg-sky-500/10",
          cta: "bg-sky-500 text-slate-950 group-hover:bg-sky-400",
          ctaLabel: "ดู Leaderboard",
        }
      : {
          ring: "hover:border-slate-600",
          glow: "bg-slate-500/10",
          cta: "bg-slate-200 text-slate-900 group-hover:bg-white",
          ctaLabel: "ดู Leaderboard",
        };

  return (
    <Link
      href={`/events/${event.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl transition ${accent.ring}`}
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl ${accent.glow}`} />

      <div className="relative mb-4 flex items-center justify-between gap-2">
        <StatusBadge status={event.status} />
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
          {event.distanceKm} กม.
        </span>
      </div>

      <h3 className="relative text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
        {event.name}
      </h3>
      <p className="relative mt-1 text-sm text-slate-400">
        {event.location} · {event.dateLabel}
      </p>

      {r && (
        <div className="relative mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">{r.name}</p>
              {r.heatName && <p className="truncate text-[11px] text-slate-500">{r.heatName}</p>}
            </div>
            {isLive && r.startedAtIso ? (
              <LiveTimer
                startedAt={r.startedAtIso}
                endedAt={r.endedAtIso}
                className="shrink-0 font-mono text-sm font-semibold text-emerald-400"
              />
            ) : event.status === "SCHEDULED" && r.scheduledLabel ? (
              <span className="shrink-0 text-[11px] font-medium text-sky-300">
                เริ่ม {r.scheduledLabel}
              </span>
            ) : null}
          </div>

          {isLive && r.lapCount > 0 && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>
                  Lap {r.currentLap}/{r.lapCount}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-4 text-xs text-slate-400">
          <span>
            <strong className="font-semibold text-slate-100">{event.athleteCount}</strong> นักกีฬา
          </span>
          <span>
            <strong className="font-semibold text-slate-100">{event.roundCount}</strong> รอบ
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${accent.cta}`}
        >
          {accent.ctaLabel} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

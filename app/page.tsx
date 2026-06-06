import Link from "next/link";
import type { Metadata } from "next";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { LiveTimer } from "@/components/common/live-timer";
import { Logo } from "@/components/partials/admin-sidebar/logo";
import { prisma } from "@/lib/prisma";
import { metersFromKm } from "@/lib/distance";
import { bangkokDateThai, bangkokDateTimeThai } from "@/lib/datetime";
import { formatRaceTime } from "@/lib/time-format";
import { lapsCompleted } from "@/lib/lap-progress";
import { AboutAccordion } from "@/components/common/about-accordion";

// Landing page reflects live race state — render at request time and let the
// client poll so newly-started / finished rounds appear without a hard reload.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "การแข่งขันเดินทน | Racewalk Tournament",
  description:
    "หน้าหลักของ Racewalk Tournament — ติดตามรอบการแข่งขันเดินทนที่กำลังดำเนินอยู่แบบเรียลไทม์ (รองรับหลายรอบที่แข่งพร้อมกัน) เปิดกระดานคะแนนสดของแต่ละรอบได้ทันที",
};

type Status = "ONGOING" | "SCHEDULED" | "FINISHED";

type PodiumEntry = { rank: number; bib: string; name: string; timeLabel: string | null };
type LeaderInfo = { bib: string; name: string; sublabel: string } | null;

// A round is the primary unit on the landing page — its event is just a label.
type RoundVM = {
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventDateLabel: string;
  roundId: string;
  roundName: string;
  heatName: string | null;
  status: Status;
  distanceKm: string;
  lapCount: number;
  currentLap: number;
  startedAtIso: string | null;
  endedAtIso: string | null;
  scheduledLabel: string | null;
  athleteCount: number;
  finishedCount: number;
  yellowCount: number;
  redCount: number;
  dqCount: number;
  podium: PodiumEntry[]; // finished rounds — top 3
  leader: LeaderInfo; // live rounds — current front-runner
};

type EventGroup = {
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventDateLabel: string;
  rounds: RoundVM[];
};

/** Group rounds under their event, preserving first-seen order. */
function groupByEvent(rounds: RoundVM[]): EventGroup[] {
  const map = new Map<string, EventGroup>();
  const order: string[] = [];
  for (const r of rounds) {
    let g = map.get(r.eventId);
    if (!g) {
      g = {
        eventId: r.eventId,
        eventName: r.eventName,
        eventLocation: r.eventLocation,
        eventDateLabel: r.eventDateLabel,
        rounds: [],
      };
      map.set(r.eventId, g);
      order.push(r.eventId);
    }
    g.rounds.push(r);
  }
  return order.map((id) => map.get(id)!);
}

export default async function Home() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null, status: { not: "DRAFT" } },
    orderBy: { date: "desc" },
    include: {
      eventAthletes: { where: { deletedAt: null }, select: { athleteId: true, bib: true } },
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            select: { athleteId: true, status: true, position: true, athlete: { select: { name: true } } },
          },
          finishTimes: {
            where: { deletedAt: null },
            select: { athleteId: true, timeMs: true, position: true },
          },
          lapTimes: { where: { deletedAt: null }, select: { athleteId: true } },
          cards: {
            where: {
              deletedAt: null,
              OR: [{ color: "YELLOW" }, { color: "RED", state: "CONFIRMED" }],
            },
            select: { color: true },
          },
        },
      },
    },
  });

  const buildRound = (e: (typeof events)[number], r: (typeof events)[number]["rounds"][number]): RoundVM => {
    const bibMap = new Map(e.eventAthletes.map((ea) => [ea.athleteId, ea.bib]));
    const lapCount = r.lapCount ?? 0;

    const lapRowsByAthlete = new Map<string, number>();
    for (const l of r.lapTimes) lapRowsByAthlete.set(l.athleteId, (lapRowsByAthlete.get(l.athleteId) ?? 0) + 1);
    const finishByAthlete = new Map(r.finishTimes.map((f) => [f.athleteId, f]));

    // In-standing (OK) athletes, with their live progress / finish info.
    const okRows = r.roundAthletes
      .filter((a) => a.status === "OK")
      .map((a) => {
        const finish = finishByAthlete.get(a.athleteId);
        return {
          bib: bibMap.get(a.athleteId) ?? "?",
          name: a.athlete.name,
          finishMs: finish?.timeMs ?? null,
          finishPos: finish?.position ?? null,
          isFinished: !!finish,
          currentLap: lapsCompleted(lapRowsByAthlete.get(a.athleteId) ?? 0, !!finish, lapCount),
        };
      });

    const finishers = okRows
      .filter((x) => x.isFinished)
      .sort((a, b) => (a.finishPos ?? 9999) - (b.finishPos ?? 9999) || (a.finishMs ?? 0) - (b.finishMs ?? 0));

    const podium: PodiumEntry[] = finishers.slice(0, 3).map((x, i) => ({
      rank: i + 1,
      bib: x.bib,
      name: x.name,
      timeLabel: x.finishMs != null ? formatRaceTime(x.finishMs) : null,
    }));

    let leader: LeaderInfo = null;
    if (finishers.length > 0) {
      const top = finishers[0];
      leader = {
        bib: top.bib,
        name: top.name,
        sublabel: top.finishMs != null ? formatRaceTime(top.finishMs) : "เข้าเส้นแล้ว",
      };
    } else {
      const front = okRows
        .filter((x) => !x.isFinished)
        .sort((a, b) => b.currentLap - a.currentLap || a.bib.localeCompare(b.bib))[0];
      if (front) {
        leader = {
          bib: front.bib,
          name: front.name,
          sublabel: lapCount > 0 ? `Lap ${front.currentLap}/${lapCount}` : `Lap ${front.currentLap}`,
        };
      }
    }

    return {
      eventId: e.id,
      eventName: e.name,
      eventLocation: e.location,
      eventDateLabel: bangkokDateThai(e.date),
      roundId: r.id,
      roundName: r.name,
      heatName: r.heatName ?? null,
      status: r.status as Status,
      distanceKm: r.distanceKm && r.distanceKm.trim() ? r.distanceKm : e.distanceKm,
      lapCount,
      currentLap: r.currentLap,
      startedAtIso: r.startedAt ? r.startedAt.toISOString() : null,
      endedAtIso: r.endedAt ? r.endedAt.toISOString() : null,
      scheduledLabel: r.scheduledTime ? bangkokDateTimeThai(r.scheduledTime) : null,
      athleteCount: r.roundAthletes.length,
      finishedCount: r.finishTimes.length,
      yellowCount: r.cards.filter((c) => c.color === "YELLOW").length,
      redCount: r.cards.filter((c) => c.color === "RED").length,
      dqCount: r.roundAthletes.filter((a) => a.status === "DQ").length,
      podium,
      leader,
    };
  };

  const rounds: RoundVM[] = events.flatMap((e) => e.rounds.map((r) => buildRound(e, r)));

  const liveRounds = rounds.filter((r) => r.status === "ONGOING");
  const upcomingRounds = rounds.filter((r) => r.status === "SCHEDULED");
  const finishedRounds = rounds.filter((r) => r.status === "FINISHED").slice(0, 9);

  const liveGroups = groupByEvent(liveRounds);
  const upcomingGroups = groupByEvent(upcomingRounds);
  const finishedGroups = groupByEvent(finishedRounds);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <AutoRefresh intervalMs={15000} />

      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">การแข่งขันเดินทน</span>
              <span className="text-[11px] text-slate-400">
                Live Scoreboard · Racewalk Events
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
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-100 backdrop-blur">
                {liveRounds.length > 0 ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    มี {liveRounds.length} รอบกำลังแข่งขันสด
                  </>
                ) : (
                  <>
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" />{" "}
                    ระบบกระดานคะแนนสด
                  </>
                )}
              </div>

              <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl lg:text-4xl">
                ติดตามการแข่งขันเดินทนแบบเรียลไทม์
              </h1>

              <p className="max-w-lg text-sm leading-relaxed text-slate-300">
                ดูอันดับนักกีฬา เวลา Lap ล่าสุด และใบเตือนของทุกรอบที่กำลังแข่งขัน —
                รองรับหลายรอบที่แข่งพร้อมกัน เลือกรอบด้านล่างเพื่อเปิดกระดานคะแนนสด
              </p>
            </div>

            <Logo
              alt="โลโก้การแข่งขันเดินทน"
              className="h-32 w-32 shrink-0 self-center drop-shadow-[0_4px_24px_rgba(56,189,248,0.25)] sm:h-44 sm:w-44 lg:h-52 lg:w-52"
            />
          </div>
        </section>

        {/* Live now */}
        <section className="mt-10">
          <SectionHeading title="กำลังแข่งขันสด" count={liveRounds.length} dotClass="bg-emerald-400" pulse />
          {liveGroups.length > 0 ? (
            <div className="space-y-8">
              {liveGroups.map((g) => (
                <EventGroupBlock key={g.eventId} group={g} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 px-6 py-12 text-center">
              <p className="text-sm text-slate-400">ขณะนี้ยังไม่มีรอบการแข่งขันที่กำลังดำเนินอยู่</p>
              <p className="mt-1 text-xs text-slate-500">
                เมื่อมีการเริ่มรอบการแข่งขัน รอบนั้นจะแสดงที่นี่โดยอัตโนมัติ
              </p>
            </div>
          )}
        </section>

        {/* Upcoming */}
        {upcomingGroups.length > 0 && (
          <section className="mt-10">
            <SectionHeading title="รอบที่กำลังจะมาถึง" count={upcomingRounds.length} dotClass="bg-sky-400" />
            <div className="space-y-8">
              {upcomingGroups.map((g) => (
                <EventGroupBlock key={g.eventId} group={g} />
              ))}
            </div>
          </section>
        )}

        {/* Recent results */}
        {finishedGroups.length > 0 && (
          <section className="mt-10">
            <SectionHeading title="ผลการแข่งขันล่าสุด" count={finishedRounds.length} dotClass="bg-slate-400" />
            <div className="space-y-8">
              {finishedGroups.map((g) => (
                <EventGroupBlock key={g.eventId} group={g} />
              ))}
            </div>
          </section>
        )}

        {/* About — animated accordion (racewalk info only) */}
        <AboutAccordion />
      </main>

      <footer className="border-t border-slate-800 py-5 text-center">
        <p className="text-xs text-slate-500">
          Powered by{" "}
          <span className="font-semibold text-slate-400">Solinex</span>
        </p>
      </footer>
    </div>
  );
}

function SectionHeading({
  title,
  count,
  dotClass,
  pulse = false,
}: Readonly<{
  title: string;
  count: number;
  dotClass: string;
  pulse?: boolean;
}>) {
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

/** Event = floating text label; its rounds are the full-width cards underneath. */
function EventGroupBlock({ group }: Readonly<{ group: EventGroup }>) {
  const liveCount = group.rounds.filter((r) => r.status === "ONGOING").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-800/70 pb-2">
        <h3 className="text-base font-semibold tracking-tight text-slate-50 sm:text-lg">
          {group.eventName}
        </h3>
        <span className="text-xs text-slate-400">
          {group.eventLocation} · {group.eventDateLabel}
        </span>
        {liveCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {liveCount} รอบสด
          </span>
        )}
        <span className="ml-auto text-[11px] font-medium text-slate-400">
          {group.rounds.length} รอบ
        </span>
      </div>
      <div className="space-y-5">
        {group.rounds.map((r) => (
          <RoundCard key={r.roundId} r={r} />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: Readonly<{ status: Status }>) {
  if (status === "ONGOING") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>{" "}
        สด
      </span>
    );
  }
  if (status === "SCHEDULED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-500/30">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />{" "}
        กำลังจะเริ่ม
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />{" "}
      เสร็จสิ้น
    </span>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];
const MEDAL_RING = [
  "ring-amber-500/40 bg-amber-500/10",
  "ring-slate-400/40 bg-slate-400/10",
  "ring-orange-700/40 bg-orange-700/10",
];

function StatChip({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: number; tone: "amber" | "red" | "slate" | "emerald" }>) {
  const toneClass = {
    amber: "text-amber-300 ring-amber-500/30 bg-amber-500/10",
    red: "text-red-300 ring-red-500/30 bg-red-500/10",
    slate: "text-slate-200 ring-slate-600 bg-slate-800/60",
    emerald: "text-emerald-300 ring-emerald-500/30 bg-emerald-500/10",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ${toneClass}`}>
      <strong className="font-semibold">{value}</strong> {label}
    </span>
  );
}

function RoundCard({ r }: Readonly<{ r: RoundVM }>) {
  const isLive = r.status === "ONGOING";
  const isFinished = r.status === "FINISHED";
  const isScheduled = r.status === "SCHEDULED";
  const pct = r.lapCount > 0 ? Math.min(100, Math.round((r.currentLap / r.lapCount) * 100)) : 0;

  const accent = isLive
    ? { ring: "hover:border-emerald-500/40 hover:shadow-emerald-500/10", glow: "bg-emerald-500/10", cta: "bg-emerald-500 text-slate-950 group-hover:bg-emerald-400" }
    : isScheduled
      ? { ring: "hover:border-sky-500/40 hover:shadow-sky-500/10", glow: "bg-sky-500/10", cta: "bg-sky-500 text-slate-950 group-hover:bg-sky-400" }
      : { ring: "hover:border-slate-600", glow: "bg-slate-500/10", cta: "bg-slate-200 text-slate-900 group-hover:bg-white" };

  return (
    <Link
      href={`/events/${r.eventId}?round=${r.roundId}`}
      className={`group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition ${accent.ring}`}
    >
      <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${accent.glow}`} />

      {/* Header */}
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={r.status} />
        <h4 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">{r.roundName}</h4>
        {r.heatName && r.heatName !== r.roundName && (
          <span className="text-xs text-slate-400">{r.heatName}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {isLive && r.startedAtIso && (
            <LiveTimer
              startedAt={r.startedAtIso}
              endedAt={r.endedAtIso}
              className="font-mono text-base font-semibold text-emerald-400"
            />
          )}
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            {metersFromKm(r.distanceKm)} ม.
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="relative grid gap-5 sm:grid-cols-2">
        {/* Left: leader / podium / schedule */}
        <div className="min-w-0">
          {isFinished ? (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                ผลการแข่งขัน
              </p>
              {r.podium.length > 0 ? (
                <ol className="space-y-1.5">
                  {r.podium.map((p) => (
                    <li
                      key={p.rank}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ring-1 ${MEDAL_RING[p.rank - 1]}`}
                    >
                      <span className="text-base leading-none">{MEDAL[p.rank - 1]}</span>
                      <span className="font-mono text-xs font-semibold text-amber-300">{p.bib}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{p.name}</span>
                      {p.timeLabel && (
                        <span className="shrink-0 font-mono text-xs text-slate-400">{p.timeLabel}</span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">ไม่มีผู้เข้าเส้นชัย</p>
              )}
            </>
          ) : isLive ? (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                ผู้นำตอนนี้
              </p>
              {r.leader ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-3 py-2.5 ring-1 ring-emerald-500/30">
                  <span className="text-xl leading-none">🥇</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-50">
                      <span className="font-mono text-amber-300">{r.leader.bib}</span> {r.leader.name}
                    </p>
                    <p className="text-[11px] text-emerald-300">{r.leader.sublabel}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">ยังไม่มีข้อมูลผู้นำ</p>
              )}
            </>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                กำหนดการ
              </p>
              <p className="text-sm text-slate-200">
                {r.scheduledLabel ? `เริ่ม ${r.scheduledLabel}` : "ยังไม่กำหนดเวลา"}
              </p>
              <p className="mt-1 text-xs text-slate-400">พร้อมแข่งขัน</p>
            </>
          )}
        </div>

        {/* Right: progress + card stats */}
        <div className="space-y-3">
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

          {(isLive || isFinished) && (
            <div className="flex flex-wrap gap-2">
              <StatChip label={`เข้ารอบแล้ว จาก ${r.athleteCount}`} value={r.finishedCount} tone="emerald" />
              <StatChip label="ใบเหลือง" value={r.yellowCount} tone="amber" />
              <StatChip label="ใบแดง" value={r.redCount} tone="red" />
              {r.dqCount > 0 && <StatChip label="DQ" value={r.dqCount} tone="red" />}
            </div>
          )}

          {isScheduled && (
            <div className="flex flex-wrap gap-2">
              <StatChip label="นักกีฬา" value={r.athleteCount} tone="slate" />
              {r.lapCount > 0 && <StatChip label="Lap" value={r.lapCount} tone="slate" />}
            </div>
          )}
        </div>
      </div>

      {/* CTA — own row, bottom-right */}
      <div className="relative flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-400">
          <strong className="font-semibold text-slate-100">{r.athleteCount}</strong> นักกีฬา ·{" "}
          <strong className="font-semibold text-slate-100">{r.lapCount}</strong> Lap
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${accent.cta}`}
        >
          ดูกระดานคะแนน <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

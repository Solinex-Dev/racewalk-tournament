import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JudgeCardMatrix } from "@/components/judge/card-matrix";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { LiveTimer } from "@/components/common/live-timer";
import { LastUpdated } from "@/components/common/last-updated";
import { prisma } from "@/lib/prisma";

// Always render at request time — public scoreboard must reflect status changes
// (race start/end, card issuance, lap recordings) within one poll cycle.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "กระดานคะแนนสดกิจกรรม – การแข่งขันเดินทน",
  description: "หน้าดูผลการแข่งขันเดินทนแบบสด (Live scoreboard) สำหรับผู้ชมและผู้ติดตาม",
};

type Props = { params: Promise<{ eventId: string }> };

function formatMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatThaiDate(dt: Date) {
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "ยังไม่เริ่ม",
  ongoing: "กำลังแข่งขัน",
  finished: "จบการแข่งขันแล้ว",
};

const STATUS_CLASS: Record<string, string> = {
  scheduled: "bg-sky-950 text-sky-300 ring-sky-800",
  ongoing: "bg-emerald-950 text-emerald-400 ring-emerald-800",
  finished: "bg-slate-900 text-slate-200 ring-slate-700",
};

const ROUND_STATUS_LABEL: Record<string, string> = {
  scheduled: "ยังไม่เริ่ม",
  ongoing: "กำลังแข่งขัน",
  finished: "เสร็จสิ้น",
};

export default async function EventLivePage(props: Props) {
  const { eventId } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            include: { athlete: { include: { affiliation: { select: { name: true } } } } },
          },
          cards: {
            where: { deletedAt: null, OR: [{ color: "YELLOW" }, { color: "RED", state: "CONFIRMED" }] },
          },
          lapTimes: { where: { deletedAt: null }, orderBy: { lapNumber: "asc" } },
          finishTimes: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!event) notFound();

  // Pick current round: ONGOING, else last FINISHED, else first SCHEDULED
  const currentRound =
    event.rounds.find((r) => r.status === "ONGOING") ||
    [...event.rounds].reverse().find((r) => r.status === "FINISHED") ||
    event.rounds[0];

  const eventStatus = event.status.toLowerCase();
  const isRaceLive =
    eventStatus !== "finished" &&
    event.rounds.some((r) => r.status === "ONGOING");

  type Row = {
    bib: string;
    athleteId: string;
    name: string;
    affiliation: string;
    country: string;
    yellowCards: number;
    redCards: number;
    position: number;
    totalTime: string;
    status: "OK" | "DQ" | "DNF";
    currentLap: number;
    isFinished: boolean;
  };

  let athletes: Row[] = [];
  let lapCount = 0;

  if (currentRound) {
    lapCount = currentRound.lapCount ?? 0;
    athletes = currentRound.roundAthletes.map((ra): Row => {
      const yellow = currentRound.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "YELLOW",
      ).length;
      const red = currentRound.cards.filter(
        (c) => c.athleteId === ra.athleteId && c.color === "RED" && c.state === "CONFIRMED",
      ).length;
      const lapsForMe = currentRound.lapTimes.filter((l) => l.athleteId === ra.athleteId);
      const finish = currentRound.finishTimes.find((f) => f.athleteId === ra.athleteId);
      const lastTimeMs = finish?.timeMs ?? lapsForMe[lapsForMe.length - 1]?.timeMs;
      return {
        bib: ra.bib,
        athleteId: ra.athleteId,
        name: ra.athlete.name,
        affiliation: ra.athlete.affiliation?.name ?? "",
        country: ra.athlete.country,
        yellowCards: yellow,
        redCards: red,
        position: ra.position ?? 0,
        totalTime: lastTimeMs !== undefined ? formatMs(lastTimeMs) : "-",
        status: ra.status,
        currentLap: lapsForMe.length + (finish ? 1 : 0),
        isFinished: !!finish,
      };
    });

    // Sort: OK first (finished by position, then current lap desc), then DQ/DNF at bottom
    athletes.sort((a, b) => {
      const aActive = a.status === "OK" ? 0 : 1;
      const bActive = b.status === "OK" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      if (a.isFinished && b.isFinished) return (a.position || 999) - (b.position || 999);
      if (a.isFinished) return -1;
      if (b.isFinished) return 1;
      if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
      return a.bib.localeCompare(b.bib);
    });
  }

  // Pre-computed fallback for rounds without startedAt (e.g., legacy finished rounds)
  const elapsedFallback: string | null = (() => {
    if (!currentRound || currentRound.startedAt) return null;
    if (currentRound.status === "FINISHED" && currentRound.finishTimes.length > 0) {
      const maxMs = Math.max(...currentRound.finishTimes.map((f) => f.timeMs));
      return formatMs(maxMs);
    }
    return null;
  })();

  const renderedAt = new Date().toISOString();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={5000} />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-10">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-400">
              การแข่งขันเดินทน
              {isRaceLive && (
                <>
                  {" "}
                  – <span className="text-red-400">สด (Live)</span>
                </>
              )}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
              {event.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {currentRound?.heatName || ""} • ระยะ {currentRound?.distanceKm || event.distanceKm} กม. •{" "}
              {event.location}
            </p>
            <p className="text-xs text-slate-400">แข่งขันวันที่ {formatThaiDate(event.date)}</p>
            {event.rounds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {event.rounds.map((r) => {
                  // Color reflects ROUND's own status — not whether it's "selected for display".
                  // The currently-displayed round gets an extra outline ring on top.
                  const statusStyle =
                    r.status === "ONGOING"
                      ? "bg-emerald-950 text-emerald-300 ring-emerald-700"
                      : r.status === "FINISHED"
                        ? "bg-slate-800 text-slate-400 ring-slate-600"
                        : "bg-sky-950 text-sky-300 ring-sky-700";
                  const isCurrent = r.id === currentRound?.id;
                  return (
                    <span
                      key={r.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${statusStyle} ${
                        isCurrent ? "outline outline-1 outline-offset-2 outline-emerald-500/60" : ""
                      }`}
                    >
                      {r.status === "ONGOING" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                      )}
                      {r.name} · {ROUND_STATUS_LABEL[r.status.toLowerCase()]}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-end gap-4">
            <div className="text-right text-lg">
              {lapCount > 0 && (
                <p className="text-slate-400">
                  Lap ปัจจุบัน{" "}
                  <span className="font-semibold text-slate-100">
                    {currentRound?.currentLap ?? 0}
                  </span>{" "}
                  / {lapCount}
                </p>
              )}
              {currentRound?.startedAt && (
                <p className="text-slate-400">
                  เวลาแข่งขัน{" "}
                  <LiveTimer
                    startedAt={currentRound.startedAt.toISOString()}
                    endedAt={currentRound.endedAt?.toISOString() ?? null}
                    className="font-mono font-semibold text-emerald-400"
                  />
                </p>
              )}
              {!currentRound?.startedAt && elapsedFallback && (
                <p className="text-slate-400">
                  เวลาแข่งขัน{" "}
                  <span className="font-mono font-semibold text-emerald-400">{elapsedFallback}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_CLASS[eventStatus]}`}
              >
                {eventStatus === "ongoing" ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                )}
                {STATUS_LABEL[eventStatus]}
              </span>
              <LastUpdated time={renderedAt} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-800 bg-slate-900/50 px-5 py-4">
              <p className="text font-bold uppercase tracking-wide text-slate-400">
                กระดานคะแนนสด
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95 text-[14px] font-medium uppercase text-slate-400 backdrop-blur">
                  <tr>
                    {/* <th className="px-5 py-4 text-center text-sm">อันดับ</th> */}
                    <th className="px-5 py-4 text-center text-sm">รอบ</th>
                    <th className="px-5 py-4 text-center text-sm">BIB</th>
                    <th className="px-5 py-4 text-center text-sm">นักกีฬา</th>
                    <th className="px-5 py-4 text-center text-sm hidden md:table-cell">ใบแดง</th>
                    {/* <th className="px-5 py-4 text-center text-sm">เวลา</th> */}
                    <th className="px-5 py-4 text-center text-sm hidden md:table-cell">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {athletes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        ยังไม่มีข้อมูลการแข่งขันในรอบนี้
                      </td>
                    </tr>
                  ) : (
                    athletes.map((athlete) => {
                      const isDQ = athlete.status === "DQ";
                      return (
                        <tr
                          key={athlete.bib}
                          className={`transition-colors text-center ${
                            isDQ ? "bg-slate-800/30 opacity-60" : "hover:bg-slate-800/50"
                          }`}
                        >
                          {/* <td className="px-5 py-4 font-bold text-slate-300">
                            {athlete.isFinished && athlete.position ? athlete.position : isDQ ? "-" : idx + 1}
                          </td> */}
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`font-mono text-sm font-semibold ${isDQ ? "text-slate-500" : "text-slate-100"}`}
                            >
                              {athlete.currentLap}
                              <span className={`text-xs font-normal ${isDQ ? "text-slate-600" : "text-slate-400"}`}>
                                /{lapCount || "?"}
                              </span>
                            </span>
                          </td>
                          <td className={`px-5 py-4 font-mono text-lg ${isDQ ? "text-slate-500" : "text-amber-400"}`}>
                            {athlete.bib}
                          </td>
                          <td className="px-5 py-4">
                            <p className={`text-sm font-bold ${isDQ ? "text-slate-500" : "text-slate-100"}`}>
                              {athlete.name}
                            </p>
                            {athlete.affiliation && (
                              <p className="text-[12px] text-slate-400">{athlete.affiliation}</p>
                            )}
                          </td>
                          <td className="hidden px-5 py-4 md:table-cell">
                            <div className="flex items-center justify-center gap-2">
                              <JudgeCardMatrix
                                yellow={athlete.yellowCards}
                                red={athlete.redCards}
                                hideYellow={true}
                                maxRed={4}
                                horizontal={true}
                              />
                            </div>
                          </td>
                          {/* <td className={`px-5 py-4 font-mono ${isDQ ? "text-slate-500" : "text-slate-100"}`}>
                            {athlete.totalTime}
                          </td> */}
                          <td className="hidden px-5 py-4 md:table-cell">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                                athlete.status === "DQ"
                                  ? "bg-red-950 text-red-400 ring-red-800"
                                  : athlete.status === "DNF"
                                    ? "bg-amber-950 text-amber-400 ring-amber-800"
                                    : "bg-emerald-950 text-emerald-400 ring-emerald-800"
                              }`}
                            >
                              {athlete.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-slate-800 from-slate-900 to-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                สำหรับกรรมการ
              </p>
              <p className="text-[14px] text-slate-300">
                ถ้าคุณเป็นกรรมการของ Event นี้ ให้เข้าไปยังหน้าสำหรับกรรมการเพื่อใช้บันทึกผลการแข่งขัน
              </p>
              <div className="mt-2 flex flex-col gap-2 text-xs">
                <a
                  href={`/judge/events/${event.id}/join`}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-[14px] font-medium text-slate-900 hover:bg-slate-200"
                >
                  เข้ารหัสกรรมการ (Judge / Head Judge / Logger / Timekeeper)
                </a>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

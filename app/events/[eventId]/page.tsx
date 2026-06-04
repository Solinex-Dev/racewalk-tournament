import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JudgeCardMatrix, type RedCardDetail } from "@/components/judge/card-matrix";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { LiveTimer } from "@/components/common/live-timer";
import { prisma } from "@/lib/prisma";
import { compareAthletesByFinish } from "@/lib/athlete-sort";
import { lapsCompleted } from "@/lib/lap-progress";

// Always render at request time — public scoreboard must reflect status changes
// (race start/end, card issuance, lap recordings) within one poll cycle.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "กระดานคะแนนสดกิจกรรม – การแข่งขันเดินทน",
  description:
    "หน้าดูผลการแข่งขันเดินทนแบบสด (Live scoreboard) สำหรับผู้ชมและผู้ติดตาม",
};

type Props = { params: Promise<{ eventId: string }> };

function formatMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatThaiDate(dt: Date) {
  return dt.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

// The heavy nested query behind the public board.
function queryLeaderboard(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      rounds: {
        where: { deletedAt: null },
        orderBy: { scheduledTime: "asc" },
        include: {
          roundAthletes: {
            where: { deletedAt: null },
            include: {
              athlete: { include: { affiliation: { select: { name: true } } } },
            },
          },
          cards: {
            where: {
              deletedAt: null,
              OR: [{ color: "YELLOW" }, { color: "RED", state: "CONFIRMED" }],
            },
          },
          lapTimes: { where: { deletedAt: null }, orderBy: { lapNumber: "asc" } },
          finishTimes: { where: { deletedAt: null } },
        },
      },
    },
  });
}

// Short-lived in-memory cache for the public leaderboard. The board polls every
// 500ms; without this, each poll re-runs the query above and — under crowd load —
// exhausts the DB connection pool, starving the officials' lap/card writes (load
// test: 98/101 writes failed at 50 concurrent viewers). Caching the result for a
// couple of seconds decouples viewer count from DB load: within the TTL every
// viewer on a server instance shares ONE query, leaving the pool free for
// officials. The board is at most ~TTL stale; the officials' own pages are never
// cached (they stay realtime). Promise-keyed so concurrent polls dedupe onto one
// in-flight query; the entry is evicted on error so failures aren't cached.
// While a round is ONGOING, cache for a full 2s to absorb the spectator crowd.
// Before that (waiting for the start), use a short TTL so the moment the
// moderator presses start — and the elapsed timer — appears promptly; pre-race
// traffic is light so the shorter TTL costs little.
const LEADERBOARD_TTL_LIVE_MS = 2000;
const LEADERBOARD_TTL_IDLE_MS = 500;
type LeaderboardData = Awaited<ReturnType<typeof queryLeaderboard>>;
type LeaderboardEntry = { at: number; ttl: number; promise: Promise<LeaderboardData> };
const leaderboardCache = new Map<string, LeaderboardEntry>();

function getLeaderboard(eventId: string): Promise<LeaderboardData> {
  const now = Date.now();
  const hit = leaderboardCache.get(eventId);
  if (hit && now - hit.at < hit.ttl) return hit.promise;
  // promise is assigned on the next line; the placeholder keeps the type honest.
  const entry: LeaderboardEntry = { at: now, ttl: LEADERBOARD_TTL_IDLE_MS, promise: undefined as never };
  entry.promise = queryLeaderboard(eventId)
    .then((event) => {
      entry.ttl = event?.rounds.some((r) => r.status === "ONGOING")
        ? LEADERBOARD_TTL_LIVE_MS
        : LEADERBOARD_TTL_IDLE_MS;
      return event;
    })
    .catch((err: unknown) => {
      leaderboardCache.delete(eventId);
      throw err;
    });
  leaderboardCache.set(eventId, entry);
  return entry.promise;
}

export default async function EventLivePage(props: Readonly<Props>) {
  const { eventId } = await props.params;

  const event = await getLeaderboard(eventId);

  if (!event) notFound();

  // Pick current round: ONGOING, else last FINISHED, else first SCHEDULED
  const currentRound =
    event.rounds.find((r) => r.status === "ONGOING") ??
    [...event.rounds].reverse().find((r) => r.status === "FINISHED") ??
    event.rounds[0];

  const eventStatus = event.status.toLowerCase();
  const isRaceLive =
    eventStatus !== "finished" &&
    event.rounds.some((r) => r.status === "ONGOING");

  const isCurrentRoundFinished =
    eventStatus === "finished" ||
    currentRound?.status === "FINISHED" ||
    currentRound?.endedAt != null;

  type Row = {
    bib: string;
    athleteId: string;
    name: string;
    affiliation: string;
    country: string;
    yellowCards: number;
    redCards: number;
    redCardDetails: RedCardDetail[];
    position: number;
    rank: number | null;
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
      const redCardsForMe = currentRound.cards.filter(
        (c) =>
          c.athleteId === ra.athleteId &&
          c.color === "RED" &&
          c.state === "CONFIRMED",
      );
      const red = redCardsForMe.length;
      // CardSymbol enum → glyph: BENT_KNEE = ">" (เข่างอ), LIFTED_FOOT = "~" (ยกเท้า)
      const redCardDetails: RedCardDetail[] = redCardsForMe.map((c) => ({
        symbol: c.symbol === "BENT_KNEE" ? ">" : "~",
      }));
      const lapsForMe = currentRound.lapTimes.filter(
        (l) => l.athleteId === ra.athleteId,
      );
      const finish = currentRound.finishTimes.find(
        (f) => f.athleteId === ra.athleteId,
      );
      const lastTimeMs =
        finish?.timeMs ?? lapsForMe.at(-1)?.timeMs;
      return {
        bib: ra.bib,
        athleteId: ra.athleteId,
        name: ra.athlete.name,
        affiliation: ra.athlete.affiliation?.name ?? "",
        country: ra.athlete.country,
        yellowCards: yellow,
        redCards: red,
        redCardDetails,
        position: ra.position ?? 0,
        rank: null,
        totalTime: lastTimeMs === undefined ? "-" : formatMs(lastTimeMs),
        status: ra.status,
        currentLap: lapsCompleted(lapsForMe.length, !!finish, lapCount),
        isFinished: !!finish,
      };
    });

    // Finish order — shared with the moderator views (see lib/athlete-sort).
    athletes.sort(compareAthletesByFinish);

    // Live final ranking: number the in-standing (OK) athletes who have crossed
    // the line, in finish order. A finisher who is later DQ'd sorts out of this
    // group, so everyone below moves up automatically — DQ-aware, computed from
    // the sorted order, no stored position rewrite needed.
    let rankCounter = 0;
    for (const a of athletes) {
      a.rank = a.status === "OK" && a.isFinished ? ++rankCounter : null;
    }
  }

  const remainingOnField = athletes.filter(
    (a) => a.status === "OK" && !a.isFinished,
  ).length;

  // Pre-computed fallback for rounds without startedAt (e.g., legacy finished rounds)
  const elapsedFallback: string | null = (() => {
    if (!currentRound || currentRound.startedAt) return null;
    if (
      currentRound.status === "FINISHED" &&
      currentRound.finishTimes.length > 0
    ) {
      const maxMs = Math.max(...currentRound.finishTimes.map((f) => f.timeMs));
      return formatMs(maxMs);
    }
    return null;
  })();

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <AutoRefresh intervalMs={500} />
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-1 px-4 py-6 lg:py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full">
            <div className="flex flex-col md:flex-row gap-3 items-start justify-between">
              <div>
                <div className="text-lg font-semibold uppercase tracking-[0.2em] text-slate-400 flex gap-2 items-center">
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
                    {event.name}
                  </div>
                </div>
                <div className="flex gap-1.5 align-center flex-wrap">
                  <p className="text-sm text-slate-300">
                    {currentRound?.distanceKm || event.distanceKm} กม. •{" "}
                    {event.location} •{" "}
                    {currentRound?.name ?? ""}
                  </p>
                  
                </div>
               
              </div>
              

              <div className="flex flex-col gap-0 items-end ms-auto">
                {isRaceLive && (
                  <div className="flex items-center gap-2">
                    <div className="bg-red-400 min-h-2 min-w-2 rounded-full block animate-pulse">
                      {" "}
                    </div>
                    <div className="text-red-400 font-semibold mb-0.5">LIVE</div>
                  </div>
                )}
                {currentRound?.startedAt && (
                  <h3 className="text-slate-400 text-2xl md:text-3xl font-semibold">
                    <LiveTimer
                      startedAt={currentRound.startedAt.toISOString()}
                      endedAt={currentRound.endedAt?.toISOString() ?? null}
                      className={`font-mono font-semibold ${isCurrentRoundFinished ? "text-slate-300" : "text-emerald-400"}`}
                    />
                  </h3>
                )}
                {(lapCount > 0 || currentRound) && (
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    {lapCount > 0 && (
                      <p>
                        Lap{" "}
                        <span className="font-semibold text-slate-100">
                          {currentRound?.currentLap ?? 0}
                        </span>{" "}
                        / {lapCount}
                      </p>
                    )}
                    |
                    {currentRound && (
                      <p>
                        เหลือในสนาม{" "}
                        <span className="font-bold text-emerald-400">
                          {remainingOnField}
                        </span> / {athletes.length}{" "}
                        คน
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 min-h-0">
          <div className="flex items-end gap-4 ">
            <div className="flex w-full gap-2 justify-between text-right text-lg">
              {/* {currentRound?.startedAt && (
                <p className="text-slate-400">
                  เวลาแข่งขัน{" "}
                  <LiveTimer
                    startedAt={currentRound.startedAt.toISOString()}
                    endedAt={currentRound.endedAt?.toISOString() ?? null}
                    className={`font-mono font-semibold ${isCurrentRoundFinished ? "text-slate-300" : "text-emerald-400"}`}
                  />
                </p>
              )} */}
              {!currentRound?.startedAt && elapsedFallback && (
                <p className="text-slate-400">
                  เวลาแข่งขัน{" "}
                  <span
                    className={`font-mono font-semibold ${isCurrentRoundFinished ? "text-slate-300" : "text-emerald-400"}`}
                  >
                    {elapsedFallback}
                  </span>
                </p>
              )}
            </div>
            {/* <div className="flex flex-col items-end gap-1.5">
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
            </div> */}
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            {/* <div className="border-b border-slate-800 bg-slate-900/50 px-5 py-4">
              <p className="text font-bold uppercase tracking-wide text-slate-400">
                กระดานคะแนนสด
              </p>
            </div> */}

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95 text-[14px] font-medium uppercase text-slate-400 backdrop-blur">
                  <tr>
                    <th className="px-5 py-4 text-center text-sm">อันดับ</th>
                    <th className="px-5 py-4 text-center text-sm">รอบ</th>
                    <th className="px-5 py-4 text-center text-sm">BIB</th>
                    <th className="px-5 py-4 text-center text-sm">นักกีฬา</th>
                    <th className="px-5 py-4 text-center text-sm hidden md:table-cell">
                      ใบแดง
                    </th>
                    {/* <th className="px-5 py-4 text-center text-sm">เวลา</th> */}
                    <th className="px-5 py-4 text-center text-sm hidden md:table-cell">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {athletes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        ยังไม่มีข้อมูลการแข่งขันในรอบนี้
                      </td>
                    </tr>
                  ) : (
                    athletes.map((athlete) => {
                      const isDQ = athlete.status === "DQ";
                      const isFinished =
                        athlete.isFinished && athlete.status === "OK";
                      const medalCls =
                        athlete.rank === 1
                          ? "bg-amber-400/20 text-amber-300 ring-amber-500/40"
                          : athlete.rank === 2
                            ? "bg-slate-300/20 text-slate-200 ring-slate-400/40"
                            : athlete.rank === 3
                              ? "bg-orange-700/30 text-orange-300 ring-orange-600/40"
                              : "bg-slate-700/40 text-slate-200 ring-slate-600/40";
                      return (
                        <tr
                          key={athlete.bib}
                          className={`transition-colors text-center ${
                            isDQ
                              ? "bg-slate-800/30 opacity-60"
                              : isFinished
                                ? "bg-emerald-950/30"
                                : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="px-5 py-4 text-center">
                            {athlete.rank !== null ? (
                              <span
                                className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-sm font-bold ring-1 ${medalCls}`}
                                title="อันดับ (คำนวณสด ปรับตามผู้ถูกตัดสิทธิ์แล้ว)"
                              >
                                {athlete.rank}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`font-mono text-sm font-semibold ${isDQ ? "text-slate-500" : "text-slate-100"}`}
                            >
                              {athlete.currentLap}
                              <span
                                className={`text-xs font-normal ${isDQ ? "text-slate-600" : "text-slate-400"}`}
                              >
                                /{lapCount || "?"}
                              </span>
                            </span>
                          </td>
                          <td
                            className={`px-5 py-4 font-mono text-lg ${isDQ ? "text-slate-500" : "text-amber-400"}`}
                          >
                            {athlete.bib}
                          </td>
                          <td className="px-5 py-4">
                            <p
                              className={`text-sm font-bold ${isDQ ? "text-slate-500" : "text-slate-100"}`}
                            >
                              {athlete.name}
                            </p>
                            {athlete.affiliation && (
                              <p className="text-[12px] text-slate-400">
                                {athlete.affiliation}
                              </p>
                            )}
                            <div className="mt-1 md:hidden">
                              <JudgeCardMatrix
                                yellow={athlete.yellowCards}
                                red={athlete.redCards}
                                redDetails={athlete.redCardDetails}
                                hideYellow={true}
                                maxRed={4}
                                horizontal={true}
                                mobile={true}
                              />
                            </div>
                          </td>
                          <td className="hidden px-5 py-4 md:table-cell">
                            <div className="flex items-center justify-center gap-2">
                              <JudgeCardMatrix
                                yellow={athlete.yellowCards}
                                red={athlete.redCards}
                                redDetails={athlete.redCardDetails}
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
                                    : isFinished
                                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-600/40"
                                      : "bg-sky-950 text-sky-300 ring-sky-800"
                              }`}
                            >
                              {athlete.status === "DQ"
                                ? "DQ"
                                : athlete.status === "DNF"
                                  ? "DNF"
                                  : isFinished
                                    ? "FINISHED"
                                    : "OK"}
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

          {/* <aside className="space-y-4">
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
                  เข้ารหัสเจ้าหน้าที่ (กรรมการ / หัวหน้ากรรมการ / ผู้เก็บ Lap Time)
                </a>
              </div>
            </div>
          </aside> */}
        </section>
      </div>
    </main>
  );
}

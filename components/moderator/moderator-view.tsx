"use client";

import { useState, useEffect, useTransition, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startRound, endRound } from "@/app/actions/round-timing";
import { SectionToc, type TocItem } from "@/components/common/section-toc";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { Play, Goal } from "lucide-react";

const MAIN_TOC: TocItem[] = [
  { id: "m-control", label: "ควบคุมการแข่งขัน" },
  { id: "m-athletes", label: "นักกีฬาในรอบนี้" },
  { id: "m-judges", label: "กรรมการในรอบนี้" },
  { id: "m-log", label: "Activity Log" },
];

export type EventStatus = "scheduled" | "ongoing" | "finished";
export type RoundStatus = "scheduled" | "ongoing" | "finished";

export type RoundInfo = {
  id: string;
  name: string;
  status: RoundStatus;
  distance_km?: string;
  scheduled_time?: string;
  expected_end_time?: string;
  started_at?: string;
  ended_at?: string;
  note?: string;
  lapCount?: number;
  currentLap?: number;
};

export type AthleteCardDetail = {
  id: string;
  color: "YELLOW" | "RED";
  symbol: "~" | ">";
  symbolLabel: string; // "ยกเท้า" / "เข่างอ"
  state: "PENDING" | "CONFIRMED" | "OVERRIDDEN" | null;
  judgeName: string;
  judgeZone: string;
  time: string;
};

export type AthleteSummary = {
  bib: string;
  name: string;
  affiliation: string;
  country?: string;
  yellowCards: number;
  redCards: number;
  status?: "OK" | "DQ" | "DNF";
  position?: number;
  cardDetails: AthleteCardDetail[];
};

export type JudgeSummary = {
  id: string;
  name: string;
  position: string;
  zone: string;
  roundId?: string;
};

export type ActivityLogItem = {
  id: string;
  timestamp: string;
  time: string;
  date?: string;
  actor: string;
  actorId?: string;
  role: "judge" | "moderator";
  action: string;
  // Free-form to match RoundActivityLog.actionType — ActionBadge does a
  // defensive lookup with fallback so unknown types still render gracefully.
  actionType?: string;
  targetAthlete?: string;
  targetBib?: string;
  roundId: string;
  details?: string;
  symbol?: "~" | ">";
};

export type PendingRedCard = {
  id: string;
  roundId: string;
  judgeId: string;
  judgeName: string;
  judgeZone: string;
  targetBib: string;
  targetAthlete: string;
  symbol: "~" | ">";
  time: string;
};

export type RoundData = {
  info: RoundInfo;
  athletes: AthleteSummary[];
  judges: JudgeSummary[];
  logs: ActivityLogItem[];
  pendingRedCards: PendingRedCard[];
};

export type EventInfo = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: EventStatus;
  currentRoundId?: string;
};

type ModeratorViewProps = {
  eventId: string;
  event: EventInfo;
  rounds: RoundData[];
};

export function ModeratorView({ eventId, event, rounds }: ModeratorViewProps) {
  const router = useRouter();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [expandedJudgeIds, setExpandedJudgeIds] = useState<Set<string>>(new Set());
  const [expandedAthleteBibs, setExpandedAthleteBibs] = useState<Set<string>>(new Set());
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  // Poll every 10s to surface new pending red cards / card updates
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [router]);

  // Tick every second for live elapsed timer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleStartRound = (roundId: string) => {
    startTransition(async () => {
      try {
        await startRound(roundId);
        toast.success("เริ่มจับเวลาการแข่งขันแล้ว");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleEndRound = (roundId: string) => {
    startTransition(async () => {
      try {
        await endRound(roundId);
        toast.success("จบการแข่งขันแล้ว");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const formatElapsed = (startIso?: string, endIso?: string): string => {
    if (!startIso) return "—";
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : now;
    const ms = Math.max(0, end - start);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const statusLabel: Record<EventStatus, string> = {
    scheduled: "ยังไม่เริ่ม",
    ongoing: "กำลังแข่งขัน",
    finished: "จบการแข่งขันแล้ว",
  };

  const statusClassName: Record<EventStatus, string> = {
    scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
    ongoing: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    finished: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  const roundStatusLabel: Record<RoundStatus, string> = {
    scheduled: "ยังไม่เริ่ม",
    ongoing: "กำลังแข่งขัน",
    finished: "เสร็จสิ้น",
  };

  const currentRound =
    rounds.find((r) => r.info.id === event.currentRoundId) ||
    rounds.find((r) => r.info.status === "ongoing") ||
    rounds[rounds.length - 1];

  const displayRoundId = selectedRoundId || currentRound?.info.id || rounds[0]?.info.id || null;
  const displayData = rounds.find((r) => r.info.id === displayRoundId);
  const displayRound = displayData?.info;

  const roundAthletes = displayData?.athletes ?? [];
  const roundJudges = displayData?.judges ?? [];
  const roundPendingCards = displayData?.pendingRedCards ?? [];

  // Athletes still on the course — no finish position yet, and not DQ/DNF.
  // `position` is set when an athlete crosses the line; DQ/DNF are resolved
  // outcomes. Used to warn (but never block) the moderator when ending early.
  const unfinishedAthletes = roundAthletes.filter(
    (a) => a.position == null && a.status !== "DQ" && a.status !== "DNF",
  );
  const finishedCount = roundAthletes.length - unfinishedAthletes.length;

  const roundLogs = (displayData?.logs ?? [])
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const logsByDate = roundLogs.reduce(
    (acc, log) => {
      const date = log.date || log.timestamp.split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    },
    {} as Record<string, ActivityLogItem[]>,
  );

  const getJudgeLogs = (judgeId: string) => {
    const logs = roundLogs
      .filter((log) => log.actorId === judgeId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return {
      yellowCards: logs.filter((log) => log.actionType === "yellow_card"),
      redCards: logs.filter((log) => log.actionType === "red_card"),
    };
  };

  const toggleJudge = (judgeId: string) => {
    setExpandedJudgeIds((prev) => {
      const next = new Set(prev);
      if (next.has(judgeId)) next.delete(judgeId);
      else next.add(judgeId);
      return next;
    });
  };

  // Independent toggle — expanding one row never collapses another.
  const toggleAthlete = (bib: string) => {
    setExpandedAthleteBibs((prev) => {
      const next = new Set(prev);
      if (next.has(bib)) next.delete(bib);
      else next.add(bib);
      return next;
    });
  };

  return (
    <>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto flex max-w-full flex-col gap-8">
          <PageBreadcrumb
            items={[
              { label: "แดชบอร์ด", href: "/admin" },
              { label: "Events", href: "/admin/events" },
              { label: event.name, href: `/admin/events/${eventId}` },
              { label: "Moderator" },
            ]}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Event Activity Log
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[event.status]}`}
                >
                  ● {statusLabel[event.status]}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                ดู Log โดยละเอียดของการแข่งขัน:{" "}
                <span className="font-medium">{event.name}</span>
              </p>
              <p className="text-xs text-slate-500">
                {event.location} • {event.date}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/admin/events/${eventId}`}>
                <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
                  กลับไปหน้า Event
                </Button>
              </Link>
              <Link href={`/events/${eventId}`}>
                <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
                  เปิดหน้า Event Leaderboard
                </Button>
              </Link>
            </div>
          </div>

          {rounds.length > 0 && (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">เลือกรอบ:</span>
                  {rounds.map((r) => (
                    <button
                      key={r.info.id}
                      onClick={() => setSelectedRoundId(r.info.id)}
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                        r.info.id === displayRoundId
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : r.info.status === "finished"
                            ? "bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200"
                            : "bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100"
                      }`}
                    >
                      {r.info.name}
                      {r.info.distance_km && ` (${r.info.distance_km} กม.)`}
                      <span className="ml-1.5 text-[10px]">
                        • {roundStatusLabel[r.info.status]}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {displayRound && (
            <div className="flex gap-6">
              <aside className="sticky top-0 hidden h-fit w-44 shrink-0 self-start lg:block">
                <SectionToc items={MAIN_TOC} />
              </aside>
              <div className="flex min-w-0 flex-1 flex-col gap-8">
              <Card id="m-control" className="scroll-mt-4 rounded-2xl border-slate-200">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{displayRound.name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {displayRound.distance_km && <span>ระยะ {displayRound.distance_km} กม.</span>}
                        {displayRound.lapCount && displayRound.currentLap !== undefined && (
                          <span>
                            • Lap {displayRound.currentLap} / {displayRound.lapCount}
                          </span>
                        )}
                      </div>
                      {displayRound.note && (
                        <p className="mt-1 text-xs text-slate-500">note : {displayRound.note}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs">
                      {/* Live elapsed timer — single source of truth */}
                      {displayRound.started_at && (
                        <p className="text-slate-600">
                          เวลาที่ใช้:{" "}
                          <span className="font-mono font-semibold text-emerald-700">
                            {formatElapsed(displayRound.started_at, displayRound.ended_at)}
                          </span>
                        </p>
                      )}
                      {displayRound.scheduled_time && (
                        <p className="text-slate-600">
                          กำหนดเริ่ม:{" "}
                          <span className="font-medium">
                            {new Date(displayRound.scheduled_time).toLocaleString("th-TH", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      )}
                      {displayRound.status === "scheduled" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartRound(displayRound.id)}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Play className="h-4 w-4" />เริ่มจับเวลาการแข่งขัน
                        </button>
                      )}
                      {displayRound.status === "ongoing" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setShowEndConfirm(true)}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <Goal className="h-4 w-4" /> จบการแข่งขัน
                        </button>
                      )}
                      {displayRound.status === "finished" && (
                        <button
                          type="button"
                          onClick={() => setShowEditConfirm(true)}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          แก้ไขข้อมูลรอบนี้
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Athletes summary */}
              <Card id="m-athletes" className="scroll-mt-4 rounded-2xl border-slate-200">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">นักกีฬาในรอบนี้</h2>
                      <p className="text-xs text-slate-500">
                        กดที่แถวเพื่อดูใบเหลือง / ใบแดง ที่ได้รับ และกรรมการที่ให้
                        (ขยายได้หลายคนพร้อมกันเพื่อเทียบ)
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {roundAthletes.length} คน
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                        <tr>
                          <th className="w-8 px-4 py-3" />
                          <th className="px-4 py-3 text-left">Bib</th>
                          <th className="px-4 py-3 text-left">นักกีฬา</th>
                          <th className="px-4 py-3 text-left">สังกัด</th>
                          <th className="px-4 py-3 text-center text-amber-600" title="ใบเหลืองทั้งหมด">
                            Y
                          </th>
                          <th
                            className="px-4 py-3 text-center text-red-600"
                            title="ใบแดงที่ยืนยันแล้ว (รอยืนยันแสดงเป็น chip ส้ม)"
                          >
                            R
                          </th>
                          <th className="px-4 py-3 text-left">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {roundAthletes.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-500">
                              ยังไม่มีนักกีฬาในรอบนี้
                            </td>
                          </tr>
                        ) : (
                          roundAthletes.map((a) => {
                            const isExpanded = expandedAthleteBibs.has(a.bib);
                            const hasCards = a.cardDetails.length > 0;
                            // Reds awaiting Head Judge decision — not yet counted toward R/DQ
                            const pendingRed = a.cardDetails.filter(
                              (c) => c.color === "RED" && c.state === "PENDING",
                            ).length;
                            return (
                              <Fragment key={a.bib}>
                                <tr
                                  className={`transition-colors ${
                                    hasCards ? "cursor-pointer hover:bg-slate-50/80" : ""
                                  } ${isExpanded ? "bg-slate-50" : ""}`}
                                  onClick={() => hasCards && toggleAthlete(a.bib)}
                                >
                                  <td className="px-4 py-3 text-center">
                                    {hasCards && (
                                      <svg
                                        className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                    {a.bib}
                                  </td>
                                  <td className="px-4 py-3 text-slate-800">{a.name}</td>
                                  <td className="px-4 py-3 text-slate-600">{a.affiliation || "-"}</td>
                                  <td className="px-4 py-3 text-center font-semibold text-amber-700">
                                    {a.yellowCards}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="font-semibold text-red-700">{a.redCards}</span>
                                      {pendingRed > 0 && (
                                        <span
                                          title="ใบแดงที่รอ Head Judge ยืนยัน (ยังไม่นับเป็น R)"
                                          className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-700"
                                        >
                                          +{pendingRed} รอ
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    <span
                                      className={`rounded-full px-2 py-0.5 font-medium ${
                                        a.status === "DQ"
                                          ? "bg-red-50 text-red-700"
                                          : a.status === "DNF"
                                            ? "bg-slate-100 text-slate-600"
                                            : "bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      {a.status ?? "OK"}
                                    </span>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={7} className="bg-slate-50/60 px-6 py-4">
                                      <AthleteCardBreakdown details={a.cardDetails} />
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Judges overview */}
              <Card id="m-judges" className="scroll-mt-4 rounded-2xl border-slate-200">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">กรรมการในรอบนี้</h2>
                      <p className="text-xs text-slate-500">
                        กดที่ชื่อกรรมการเพื่อดูใบที่ให้
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {roundPendingCards.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-300">
                          ● {roundPendingCards.length} ใบแดงรอยืนยัน
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {roundJudges.length} คน
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                        <tr>
                          <th className="w-10 px-4 py-4" />
                          <th className="px-4 py-4 text-left">ชื่อกรรมการ</th>
                          <th className="px-4 py-4 text-left">ตำแหน่ง</th>
                          <th className="px-4 py-4 text-center text-amber-600">ใบเหลือง</th>
                          <th className="px-4 py-4 text-center text-red-600">ใบแดง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {roundJudges.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-xs text-slate-500">
                              ยังไม่มีข้อมูลกรรมการในรอบนี้
                            </td>
                          </tr>
                        ) : (
                          roundJudges.map((judge) => {
                            const isExpanded = expandedJudgeIds.has(judge.id);
                            const { yellowCards, redCards } = getJudgeLogs(judge.id);
                            const judgePending = roundPendingCards.filter(
                              (p) => p.judgeId === judge.id,
                            );
                            const hasPending = judgePending.length > 0;
                            return (
                              <Fragment key={judge.id}>
                                <tr
                                  className={`cursor-pointer transition-colors ${
                                    hasPending
                                      ? "bg-red-50 hover:bg-red-100/70"
                                      : isExpanded
                                        ? "bg-slate-50"
                                        : "hover:bg-slate-50/70"
                                  }`}
                                  onClick={() => toggleJudge(judge.id)}
                                >
                                  <td className="w-10 px-4 py-4 text-center">
                                    <svg
                                      className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900">
                                        {judge.name}
                                      </span>
                                      {hasPending && (
                                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                          {judgePending.length} รอยืนยัน
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-slate-600">{judge.position}</td>
                                  <td className="px-4 py-4 text-center font-semibold text-amber-700">
                                    {yellowCards.length}
                                  </td>
                                  <td className="px-4 py-4 text-center font-semibold text-red-700">
                                    {redCards.length}
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={5} className="bg-slate-50/60 px-8 py-6">
                                      <div className="space-y-5">
                                        {judgePending.length > 0 && (
                                          <PendingRedCardSection
                                            cards={judgePending}
                                            eventId={eventId}
                                          />
                                        )}
                                        <CardListSection
                                          color="amber"
                                          title="ใบเหลืองที่ให้"
                                          logs={yellowCards}
                                        />
                                        <CardListSection
                                          color="red"
                                          title="ใบแดงที่ให้"
                                          logs={redCards}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Activity log */}
              <Card id="m-log" className="scroll-mt-4 rounded-2xl border-slate-200">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Activity Log - {displayRound.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        บันทึกว่าใครทำอะไร เวลาไหน และเกี่ยวข้องกับนักกีฬาคนใด
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {roundLogs.length} เหตุการณ์
                    </span>
                  </div>
                  <div className="max-h-[600px] overflow-auto">
                    {roundLogs.length > 0 ? (
                      Object.entries(logsByDate).map(([date, logs]) => (
                        <div key={date} className="border-b border-slate-200 last:border-b-0">
                          <div className="sticky top-0 z-10 bg-slate-50 px-6 py-3.5">
                            <p className="text-xs font-semibold text-slate-700">{date}</p>
                          </div>
                          <ul className="divide-y divide-slate-200 bg-white text-xs text-slate-700">
                            {logs.map((log) => (
                              <li
                                key={log.id}
                                className="flex gap-4 px-6 py-5 hover:bg-slate-50/50"
                              >
                                <div className="mt-0.5 w-20 shrink-0">
                                  <div className="font-mono text-[11px] font-semibold text-slate-900">
                                    {log.time}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-900">
                                      {log.actor}
                                    </span>
                                    <span
                                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                        log.role === "judge"
                                          ? "bg-sky-50 text-sky-700"
                                          : "bg-emerald-50 text-emerald-700"
                                      }`}
                                    >
                                      {log.role === "judge" ? "Judge" : "Moderator"}
                                    </span>
                                    {log.actionType && (
                                      <ActionBadge actionType={log.actionType} />
                                    )}
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-700">
                                    {log.action}
                                    {log.targetAthlete && (
                                      <>
                                        {" "}
                                        –{" "}
                                        <span className="font-medium text-slate-900">
                                          {log.targetBib && `Bib ${log.targetBib} `}
                                          {log.targetAthlete}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                  {log.details && (
                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                      {log.details}
                                    </p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-500">ยังไม่มี Activity Log ในรอบนี้</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          )}
        </div>

      </main>

      {showEditConfirm && displayRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">ยืนยันการแก้ไขข้อมูล</h2>
              <button
                type="button"
                onClick={() => setShowEditConfirm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">รอบที่จะแก้ไข</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{displayRound.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">{event.name}</span>
                  {displayRound.distance_km && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                      {displayRound.distance_km} กม.
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      displayRound.status === "finished"
                        ? "bg-slate-200 text-slate-700"
                        : displayRound.status === "ongoing"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {roundStatusLabel[displayRound.status]}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                คุณกำลังจะเข้าสู่โหมดแก้ไขข้อมูลรอบนี้ การเปลี่ยนแปลงจะถูกบันทึกเป็น audit log
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditConfirm(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditConfirm(false);
                    router.push(
                      `/admin/events/${eventId}/moderator/edit?round=${displayRoundId}`,
                    );
                  }}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEndConfirm && displayRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg text-red-600">
                ■
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900">ยืนยันจบการแข่งขัน</h2>
                <p className="mt-1 text-sm text-slate-600">
                  รอบ <span className="font-medium text-slate-900">{displayRound.name}</span>
                  {displayRound.started_at && (
                    <>
                      {" "}• เวลาที่ใช้{" "}
                      <span className="font-mono font-semibold text-emerald-700">
                        {formatElapsed(displayRound.started_at, displayRound.ended_at)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowEndConfirm(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            {unfinishedAthletes.length > 0 ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-red-700">
                  <span aria-hidden>⚠</span>
                  ยังมีนักกีฬาที่ยังไม่เข้าเส้นชัย {unfinishedAthletes.length} คน
                  <span className="font-normal text-red-500">
                    (เข้าเส้นแล้ว {finishedCount}/{roundAthletes.length})
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-red-600/80">
                  หากจบตอนนี้ นักกีฬาเหล่านี้จะไม่มีเวลาเข้าเส้นชัย/อันดับ — ตรวจสอบรายชื่อก่อนยืนยัน
                </p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-auto pr-0.5">
                  {unfinishedAthletes.map((a) => (
                    <li
                      key={a.bib}
                      className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-xs ring-1 ring-red-100"
                    >
                      <span className="w-9 shrink-0 font-mono font-semibold text-slate-900">
                        #{a.bib}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-700">{a.name}</span>
                      {a.affiliation && (
                        <span className="hidden max-w-[40%] truncate text-[10px] text-slate-400 sm:block">
                          {a.affiliation}
                        </span>
                      )}
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                        ยังไม่เข้าเส้น
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              roundAthletes.length > 0 && (
                <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                  <span aria-hidden>✓</span>
                  นักกีฬาเข้าเส้นชัยครบทุกคนแล้ว ({roundAthletes.length} คน)
                </div>
              )
            )}

            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-100">
              เมื่อจบการแข่งขัน:
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>รอบนี้จะถูกปิด และหยุดบันทึกผลใหม่</li>
                <li>กรรมการทุกคนจะได้รับแจ้งให้ออกจากระบบ</li>
                <li>ยังแก้ไขย้อนหลังได้ในโหมด Correction</li>
              </ul>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowEndConfirm(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setShowEndConfirm(false);
                  handleEndRound(displayRound.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                ■ ยืนยันจบการแข่งขัน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AthleteCardBreakdown({ details }: { details: AthleteCardDetail[] }) {
  const yellows = details.filter((c) => c.color === "YELLOW");
  const reds = details.filter((c) => c.color === "RED");

  const stateLabel = (state: AthleteCardDetail["state"]): { label: string; cls: string } => {
    switch (state) {
      case "CONFIRMED":
        return { label: "ยืนยันแล้ว", cls: "bg-red-100 text-red-700" };
      case "PENDING":
        return { label: "รอยืนยัน", cls: "bg-orange-100 text-orange-700" };
      case "OVERRIDDEN":
        return { label: "ยกเลิกแล้ว", cls: "bg-slate-200 text-slate-500 line-through" };
      default:
        return { label: "", cls: "" };
    }
  };

  const CardRow = ({ c }: { c: AthleteCardDetail }) => {
    const isYellow = c.color === "YELLOW";
    const st = stateLabel(c.state);
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
          isYellow ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-bold text-white ${
              isYellow ? "bg-amber-400" : "bg-red-500"
            }`}
          >
            {c.symbol}
          </span>
          <div>
            <p className="text-[11px] font-medium text-slate-800">
              {c.symbolLabel}
              {!isYellow && st.label && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${st.cls}`}>
                  {st.label}
                </span>
              )}
            </p>
            <p className="text-[10px] text-slate-500">
              โดย <span className="font-medium text-slate-700">{c.judgeName}</span>
              {c.judgeZone && ` (${c.judgeZone})`} • {c.time}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold">
            {yellows.length}
          </span>
          ใบเหลืองที่ได้รับ
        </h4>
        {yellows.length > 0 ? (
          <div className="space-y-1.5">
            {yellows.map((c) => (
              <CardRow key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">ไม่มีใบเหลือง</p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold">
            {reds.length}
          </span>
          ใบแดงที่ได้รับ
        </h4>
        {reds.length > 0 ? (
          <div className="space-y-1.5">
            {reds.map((c) => (
              <CardRow key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">ไม่มีใบแดง</p>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ actionType }: { actionType: ActivityLogItem["actionType"] }) {
  if (!actionType) return null;
  // Known action types — defensive lookup with sensible fallback for unknown values
  // (RoundActivityLog.actionType is a free-form string, so new types may appear)
  const labels: Record<string, { label: string; cls: string }> = {
    yellow_card:         { label: "ใบเหลือง",       cls: "bg-amber-50 text-amber-700" },
    red_card:            { label: "ใบแดง",          cls: "bg-red-50 text-red-700" },
    red_card_confirm:    { label: "ยืนยันใบแดง",     cls: "bg-red-50 text-red-700" },
    red_card_override:   { label: "ยกเลิกใบแดง",    cls: "bg-slate-100 text-slate-700" },
    athlete_dq:          { label: "DQ",             cls: "bg-red-100 text-red-800" },
    athlete_dnf:         { label: "DNF",            cls: "bg-amber-100 text-amber-800" },
    round_start:         { label: "เริ่มรอบ",        cls: "bg-emerald-50 text-emerald-700" },
    round_end:           { label: "จบรอบ",          cls: "bg-slate-100 text-slate-700" },
    lap_time:            { label: "Lap",            cls: "bg-sky-50 text-sky-700" },
    finish_time:         { label: "เข้าเส้นชัย",     cls: "bg-emerald-100 text-emerald-800" },
    moderator_delete_card:    { label: "Mod: ลบใบ",     cls: "bg-violet-50 text-violet-700" },
    moderator_confirm_red:    { label: "Mod: ยืนยันแดง", cls: "bg-violet-50 text-violet-700" },
    moderator_reject_red:     { label: "Mod: ยกเลิกแดง", cls: "bg-violet-50 text-violet-700" },
    moderator_edit_card:      { label: "Mod: แก้ใบ",    cls: "bg-violet-50 text-violet-700" },
    moderator_edit_finish_position: { label: "Mod: แก้อันดับ", cls: "bg-violet-50 text-violet-700" },
    moderator_edit_round:     { label: "Mod: แก้รอบ",   cls: "bg-violet-50 text-violet-700" },
    moderator_override_status:{ label: "Mod: สถานะ",    cls: "bg-violet-50 text-violet-700" },
    moderator_edit_lap:       { label: "Mod: แก้ Lap",  cls: "bg-violet-50 text-violet-700" },
    moderator_delete_lap:     { label: "Mod: ลบ Lap",   cls: "bg-violet-50 text-violet-700" },
    moderator_edit_finish:    { label: "Mod: แก้ Finish",cls: "bg-violet-50 text-violet-700" },
    moderator_delete_finish:  { label: "Mod: ลบ Finish", cls: "bg-violet-50 text-violet-700" },
    other:               { label: "อื่นๆ",          cls: "bg-slate-50 text-slate-600" },
  };
  const meta = labels[actionType] ?? { label: actionType, cls: "bg-slate-50 text-slate-600" };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function PendingRedCardSection({ cards, eventId: _eventId }: { cards: PendingRedCard[]; eventId: string }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-red-700">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {cards.length}
        </span>
        ใบแดงรอยืนยัน
      </h4>
      <div className="space-y-3">
        {cards.map((pending) => (
          <div
            key={pending.id}
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
                {pending.symbol}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Bib {pending.targetBib} – {pending.targetAthlete}
                </p>
                <p className="text-[10px] text-slate-500">
                  {pending.symbol === ">" ? "งอเข่า" : "ยกเท้า"} • {pending.time}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              ใช้หน้า Head Judge เพื่อยืนยัน / ปฏิเสธ
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardListSection({
  color,
  title,
  logs,
}: {
  color: "amber" | "red";
  title: string;
  logs: ActivityLogItem[];
}) {
  const cls = color === "amber"
    ? { ring: "border-amber-200", header: "bg-amber-50 text-amber-700", divider: "divide-amber-100", chip: "bg-amber-400" }
    : { ring: "border-red-200", header: "bg-red-50 text-red-700", divider: "divide-red-100", chip: "bg-red-500" };
  return (
    <div className="space-y-3">
      <h4 className={`flex items-center gap-2 text-xs font-semibold ${color === "amber" ? "text-amber-700" : "text-red-700"}`}>
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${color === "amber" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"} text-[10px] font-bold`}>
          {logs.length}
        </span>
        {title}
      </h4>
      {logs.length > 0 ? (
        <div className={`overflow-hidden rounded-lg border ${cls.ring}`}>
          <table className="min-w-full text-[11px]">
            <thead className={`${cls.header} text-[10px] font-medium uppercase`}>
              <tr>
                <th className="px-4 py-3 text-left">Bib</th>
                <th className="px-4 py-3 text-left">นักกีฬา</th>
                <th className="px-4 py-3 text-left">เวลา</th>
                <th className="px-4 py-3 text-left">ลักษณะความผิด</th>
              </tr>
            </thead>
            <tbody className={`${cls.divider} divide-y bg-white`}>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {log.targetBib ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{log.targetAthlete ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{log.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {log.symbol && (
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${cls.chip} font-mono text-[10px] font-bold text-white`}>
                          {log.symbol}
                        </span>
                      )}
                      <span className="text-slate-700">{log.details ?? "-"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-400">ยังไม่ได้ให้{title.includes("เหลือง") ? "ใบเหลือง" : "ใบแดง"}</p>
      )}
    </div>
  );
}

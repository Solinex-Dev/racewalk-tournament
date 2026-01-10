"use client";

import { use, useState, Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  JudgeCardMatrix,
  MAX_YELLOW,
  MAX_RED,
  type YellowCardDetail,
} from "@/components/judge/card-matrix";

type EventHeadJudgePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type EventStatus = "scheduled" | "ongoing" | "finished";

type RoundInfo = {
  id: string;
  name: string;
  status: "scheduled" | "ongoing" | "finished";
  distance_km?: string;
  scheduled_time?: string;
  expected_end_time?: string;
  note?: string;
  heat_name?: string;
  lapCount?: number;
  currentLap?: number;
  elapsed?: string;
};

type AthleteSummary = {
  bib: string;
  name: string;
  affiliation: string;
  country?: string;
  yellowCards: number;
  redCards: number;
  yellowDetails?: YellowCardDetail[];
  status?: "OK" | "DQ" | "DNF";
  position?: number;
};

type JudgeSummary = {
  id: string;
  name: string;
  position: string;
  zone: string;
  roundId?: string;
};

type ActivityLogItem = {
  id: string;
  timestamp: string;
  time: string;
  date?: string;
  actor: string;
  actorId?: string;
  role: "judge" | "moderator" | "head_judge";
  action: string;
  actionType?: "yellow_card" | "red_card" | "red_card_confirm" | "red_card_override" | "round_start" | "round_end" | "other";
  targetAthlete?: string;
  targetBib?: string;
  roundId: string;
  details?: string;
  canOverride?: boolean;
};

type EventInfo = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: EventStatus;
  rounds: RoundInfo[];
  currentRoundId?: string;
};

const MOCK_EVENT_STATUS: Record<string, EventInfo> = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    date: "15 มีนาคม 2025",
    location: "สนามกีฬาแห่งชาติ",
    status: "ongoing",
    rounds: [
      {
        id: "round-1",
        name: "รอบคัดเลือก",
        status: "finished",
        distance_km: "10",
        scheduled_time: "2025-03-15T08:00",
        expected_end_time: "2025-03-15T10:30",
        note: "รอบแรกสำหรับคัดเลือก",
        heat_name: "รุ่นทั่วไป ระยะ 10 กม.",
        lapCount: 10,
        currentLap: 10,
        elapsed: "00:52:30",
      },
      {
        id: "round-2",
        name: "รอบชิงชนะเลิศ",
        status: "ongoing",
        distance_km: "20",
        scheduled_time: "2025-03-15T14:00",
        expected_end_time: "2025-03-15T17:00",
        note: "รอบสุดท้าย",
        heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
        lapCount: 20,
        currentLap: 7,
        elapsed: "00:46:32",
      },
    ],
    currentRoundId: "round-2",
  },
};

const MOCK_ATHLETES_BY_ROUND: Record<string, AthleteSummary[]> = {
  "round-1": [
    {
      bib: "01",
      name: "Somchai Rakdee",
      affiliation: "ชมรมเดินทนกรุงเทพฯ",
      country: "THA",
      yellowCards: 1,
      redCards: 0,
      status: "OK",
      position: 1,
    },
    {
      bib: "02",
      name: "Jane Doe",
      affiliation: "Example Athletic Club",
      country: "USA",
      yellowCards: 2,
      redCards: 0,
      status: "OK",
      position: 2,
    },
  ],
  "round-2": [
    {
      bib: "01",
      name: "Somchai Rakdee",
      affiliation: "ชมรมเดินทนกรุงเทพฯ",
      country: "THA",
      yellowCards: 2,
      redCards: 0,
      status: "OK",
      position: 1,
    },
    {
      bib: "02",
      name: "Jane Doe",
      affiliation: "Example Athletic Club",
      country: "USA",
      yellowCards: 3,
      redCards: 1,
      status: "OK",
      position: 2,
    },
    {
      bib: "04",
      name: "Luis Garcia",
      affiliation: "Madrid Racewalk Club",
      country: "ESP",
      yellowCards: 6,
      redCards: 2,
      status: "DQ",
      position: 4,
    },
  ],
};

const MOCK_JUDGES_BY_ROUND: Record<string, JudgeSummary[]> = {
  "round-1": [
    {
      id: "J-01",
      name: "Coach A",
      position: "โค้งที่ 1",
      zone: "Zone A",
      roundId: "round-1",
    },
    {
      id: "J-02",
      name: "Coach B",
      position: "ทางตรงฝั่งสแตนด์",
      zone: "Zone B",
      roundId: "round-1",
    },
  ],
  "round-2": [
    {
      id: "J-01",
      name: "Coach A",
      position: "โค้งที่ 1",
      zone: "Zone A",
      roundId: "round-2",
    },
    {
      id: "J-02",
      name: "Coach B",
      position: "ทางตรงฝั่งสแตนด์",
      zone: "Zone B",
      roundId: "round-2",
    },
  ],
};

const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "log-001",
    timestamp: "2025-03-15T14:25:09",
    time: "14:25:09",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบแดง (สัญลักษณ์: >)",
    actionType: "red_card",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-2",
    details: "Zone B - เข่างอ",
    canOverride: true,
  },
  {
    id: "log-002",
    timestamp: "2025-03-15T14:15:32",
    time: "14:15:32",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    roundId: "round-2",
    details: "Zone A - โค้งที่ 1",
  },
];

export default function EventHeadJudgePage(
  props: EventHeadJudgePageProps,
) {
  const { eventId } = use(props.params);
  const eventInfo = MOCK_EVENT_STATUS[eventId];
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [expandedAthleteBibs, setExpandedAthleteBibs] = useState<Set<string>>(new Set());

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

  const roundStatusLabel: Record<
    "scheduled" | "ongoing" | "finished",
    string
  > = {
    scheduled: "ยังไม่เริ่ม",
    ongoing: "กำลังแข่งขัน",
    finished: "เสร็จสิ้น",
  };

  const currentRound = eventInfo?.rounds?.find(
    (r) => r.id === eventInfo.currentRoundId,
  ) ||
    eventInfo?.rounds?.find((r) => r.status === "ongoing") ||
    eventInfo?.rounds?.[eventInfo.rounds.length - 1];

  const displayRoundId = selectedRoundId || currentRound?.id || eventInfo?.rounds?.[0]?.id || null;
  const displayRound = eventInfo?.rounds?.find((r) => r.id === displayRoundId);

  const roundAthletes = displayRoundId ? MOCK_ATHLETES_BY_ROUND[displayRoundId] || [] : [];
  const roundJudges = displayRoundId ? MOCK_JUDGES_BY_ROUND[displayRoundId] || [] : [];
  const roundLogs = displayRoundId 
    ? MOCK_ACTIVITY_LOGS.filter((log) => log.roundId === displayRoundId).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    : [];

  const maxYellowCards = roundJudges.length * 2;
  const maxRedCards = roundJudges.length * 1;

  const logsByDate = roundLogs.reduce((acc, log) => {
    const date = log.date || log.timestamp.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLogItem[]>);

  const getAthleteCardDetails = (bib: string) => {
    const athleteLogs = roundLogs.filter(
      (log) =>
        log.targetBib === bib &&
        (log.actionType === "yellow_card" ||
          log.actionType === "red_card" ||
          log.actionType === "red_card_confirm" ||
          log.actionType === "red_card_override")
    );
    
    const yellowCards = athleteLogs.filter((log) => log.actionType === "yellow_card");
    const redCards = athleteLogs.filter(
      (log) => log.actionType === "red_card" || log.actionType === "red_card_confirm" || log.actionType === "red_card_override"
    );

    return {
      yellowCards: yellowCards.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      redCards: redCards.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    };
  };

  const handleConfirmRedCard = (logId: string) => {
    // TODO: ภายหลังเชื่อมต่อ API
    alert("ยืนยันใบแดงเรียบร้อย (mock)");
  };

  const handleOverrideRedCard = (logId: string) => {
    // TODO: ภายหลังเชื่อมต่อ API
    if (confirm("คุณต้องการยกเลิกใบแดงนี้หรือไม่?")) {
      alert("ยกเลิกใบแดงเรียบร้อย (mock)");
    }
  };

  if (!eventInfo) {
    return (
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              ไม่พบข้อมูล Event สำหรับ ID: <span className="font-mono">{eventId}</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                หน้าจอมอนิเตอร์ - หัวหน้ากรรมการ
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[eventInfo.status]}`}
              >
                ● {statusLabel[eventInfo.status]}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              ดูแลและมอนิเตอร์การแข่งขันทั้งหมด:{" "}
              <span className="font-medium">{eventInfo.name}</span>
            </p>
            <p className="text-xs text-slate-500">
              {eventInfo.location} • {eventInfo.date}
            </p>
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ คุณสามารถยืนยันหรือแก้ไขการตัดสินของกรรมการได้ แต่ไม่มีสิทธิ์แก้ไขข้อมูลนักกีฬา
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/events/${eventId}`}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 text-xs"
              >
                ดูหน้า Public
              </Button>
            </Link>
          </div>
        </div>

        {/* Round Selector */}
        {eventInfo.rounds && eventInfo.rounds.length > 0 && (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">เลือกรอบ:</span>
                {eventInfo.rounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRoundId(round.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                      round.id === displayRoundId
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : round.status === "finished"
                          ? "bg-slate-100 text-slate-600 ring-slate-200 hover:bg-slate-200"
                          : "bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100"
                    }`}
                  >
                    {round.name}
                    {round.distance_km && ` (${round.distance_km} กม.)`}
                    <span className="ml-1.5 text-[10px]">
                      • {roundStatusLabel[round.status]}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {displayRound && (
          <>
            {/* Round Info */}
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {displayRound.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {displayRound.distance_km && (
                        <span>ระยะ {displayRound.distance_km} กม.</span>
                      )}
                      {displayRound.heat_name && (
                        <span>• {displayRound.heat_name}</span>
                      )}
                      {displayRound.lapCount && displayRound.currentLap && (
                        <span>
                          • Lap {displayRound.currentLap} / {displayRound.lapCount}
                        </span>
                      )}
                      {displayRound.elapsed && (
                        <span className="font-mono">• เวลา {displayRound.elapsed}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Athletes & Judges Overview */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Athletes summary */}
              <Card className="lg:col-span-2 rounded-2xl border-slate-200">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        นักกีฬาในรอบนี้
                      </h2>
                      <p className="text-xs text-slate-500">
                        ดูจำนวนใบเหลือง/ใบแดงที่แต่ละคนได้รับ
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
                          <th className="px-3 py-2 text-left">Bib</th>
                          <th className="px-3 py-2 text-left">ชื่อ</th>
                          <th className="px-3 py-2 text-left">สังกัด</th>
                          <th className="px-3 py-2 text-center">ใบเหลือง / ใบแดง</th>
                          <th className="px-3 py-2 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {roundAthletes.length > 0 ? (
                          roundAthletes.map((athlete) => {
                            const isExpanded = expandedAthleteBibs.has(athlete.bib);
                            const cardDetails = getAthleteCardDetails(athlete.bib);
                            
                            const toggleExpand = () => {
                              setExpandedAthleteBibs((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(athlete.bib)) {
                                  newSet.delete(athlete.bib);
                                } else {
                                  newSet.add(athlete.bib);
                                }
                                return newSet;
                              });
                            };
                            
                            return (
                              <Fragment key={athlete.bib}>
                                <tr
                                  className={`hover:bg-slate-50/70 cursor-pointer transition-colors ${
                                    isExpanded ? "bg-slate-50" : ""
                                  }`}
                                  onClick={toggleExpand}
                                >
                                  <td className="px-3 py-2 font-semibold text-slate-900">
                                    {athlete.bib}
                                  </td>
                                  <td className="px-3 py-2 text-slate-800">
                                    {athlete.name}
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {athlete.affiliation}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-col gap-2.5 min-w-[160px]">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-amber-700">
                                            Y {athlete.yellowCards}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-red-700">
                                            R {athlete.redCards}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {athlete.status && (
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                          athlete.status === "DQ"
                                            ? "bg-red-50 text-red-700"
                                            : athlete.status === "DNF"
                                              ? "bg-amber-50 text-amber-700"
                                              : "bg-emerald-50 text-emerald-700"
                                        }`}
                                      >
                                        {athlete.status}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={5} className="px-3 py-4 bg-slate-50/50">
                                      <div className="space-y-4">
                                        {/* Red Cards Details with Actions */}
                                        {cardDetails.redCards.length > 0 ? (
                                          <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-red-700 flex items-center gap-2">
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                                                {cardDetails.redCards.length}
                                              </span>
                                              ใบแดงที่ได้รับ
                                            </h4>
                                            <div className="space-y-1.5 pl-7">
                                              {cardDetails.redCards.map((log, index) => {
                                                const judge = roundJudges.find(
                                                  (j) => j.id === log.actorId
                                                );
                                                const isConfirmed = log.actionType === "red_card_confirm" || log.actionType === "red_card_override";
                                                const canOverride = log.canOverride && !isConfirmed;
                                                return (
                                                  <div
                                                    key={log.id}
                                                    className={`flex items-start gap-2 text-[11px] text-slate-700 bg-white rounded-lg border px-3 py-2 ${
                                                      isConfirmed
                                                        ? "border-emerald-300 bg-emerald-50/30"
                                                        : "border-red-200"
                                                    }`}
                                                  >
                                                    <span
                                                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 mt-0.5 ${
                                                        isConfirmed
                                                          ? "bg-emerald-500"
                                                          : "bg-red-500"
                                                      }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-slate-900">
                                                          ใบแดง #{index + 1}
                                                          {isConfirmed && (
                                                            <span className="ml-1 text-[10px] text-emerald-700">
                                                              (ยืนยันแล้ว)
                                                            </span>
                                                          )}
                                                        </span>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="font-mono text-[10px] text-slate-500">
                                                          {log.time}
                                                        </span>
                                                      </div>
                                                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-slate-600">
                                                          {isConfirmed ? "ยืนยันโดย" : "จาก"}:{" "}
                                                          <span className="font-medium">{log.actor}</span>
                                                        </span>
                                                        {judge && (
                                                          <>
                                                            <span className="text-slate-400">•</span>
                                                            <span className="text-slate-500 text-[10px]">
                                                              {judge.position} ({judge.zone})
                                                            </span>
                                                          </>
                                                        )}
                                                      </div>
                                                      {log.details && (
                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                          {log.details}
                                                        </p>
                                                      )}
                                                    </div>
                                                    {canOverride && (
                                                      <div className="flex gap-1 shrink-0">
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-6 px-2 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConfirmRedCard(log.id);
                                                          }}
                                                        >
                                                          ยืนยัน
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-6 px-2 text-[10px] border-red-300 text-red-700 hover:bg-red-50"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOverrideRedCard(log.id);
                                                          }}
                                                        >
                                                          ยกเลิก
                                                        </Button>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-slate-400 pl-7">
                                            ยังไม่ได้รับใบแดง
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-xs text-slate-500">
                              ยังไม่มีข้อมูลนักกีฬาในรอบนี้
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Judges summary */}
              <Card className="rounded-2xl border-slate-200">
                <CardContent className="space-y-3 p-4 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        กรรมการในรอบนี้
                      </h2>
                      <p className="text-xs text-slate-500">
                        ใครนั่งอยู่ตรงไหน / โซนใดในสนาม
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {roundJudges.length} คน
                    </span>
                  </div>

                  <div className="space-y-2">
                    {roundJudges.length > 0 ? (
                      roundJudges.map((judge) => (
                        <div
                          key={judge.id}
                          className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {judge.name}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {judge.position}
                            </p>
                          </div>
                          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                            {judge.zone}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">ยังไม่มีข้อมูลกรรมการในรอบนี้</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Activity Log */}
        {displayRound && (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
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
                      <div className="sticky top-0 z-10 bg-slate-50 px-4 py-2">
                        <p className="text-xs font-semibold text-slate-700">{date}</p>
                      </div>
                      <ul className="divide-y divide-slate-200 bg-white text-xs text-slate-700">
                        {logs.map((log) => (
                          <li key={log.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50/50">
                            <div className="mt-0.5 w-20 shrink-0">
                              <div className="text-[11px] font-mono font-semibold text-slate-900">
                                {log.time}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-900">
                                  {log.actor}
                                </span>
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
                                    log.role === "judge"
                                      ? "bg-sky-50 text-sky-700"
                                      : log.role === "head_judge"
                                        ? "bg-purple-50 text-purple-700"
                                        : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {log.role === "judge" ? "Judge" : log.role === "head_judge" ? "Head Judge" : "Moderator"}
                                </span>
                                {log.actionType && (
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                      log.actionType === "yellow_card"
                                        ? "bg-amber-50 text-amber-700"
                                        : log.actionType === "red_card" || log.actionType === "red_card_confirm" || log.actionType === "red_card_override"
                                          ? "bg-red-50 text-red-700"
                                          : "bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {log.actionType === "yellow_card"
                                      ? "ใบเหลือง"
                                      : log.actionType === "red_card"
                                        ? "ใบแดง"
                                        : log.actionType === "red_card_confirm"
                                          ? "ยืนยันใบแดง"
                                          : log.actionType === "red_card_override"
                                            ? "ยกเลิกใบแดง"
                                            : "อื่นๆ"}
                                  </span>
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
                    <p className="text-xs text-slate-500">
                      ยังไม่มี Activity Log ในรอบนี้
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}


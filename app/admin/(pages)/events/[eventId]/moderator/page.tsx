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

type EventModeratorPageProps = {
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
  role: "judge" | "moderator";
  action: string;
  actionType?: "yellow_card" | "red_card" | "red_card_confirm" | "round_start" | "round_end" | "other";
  targetAthlete?: string;
  targetBib?: string;
  roundId: string;
  details?: string;
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
  "evt-002": {
    id: "evt-002",
    name: "Bangkok City Racewalk",
    date: "20 มกราคม 2025",
    location: "Bangkok City Route",
    status: "finished",
    rounds: [
      {
        id: "round-1",
        name: "รอบเดียว",
        status: "finished",
        distance_km: "10",
        scheduled_time: "2025-01-20T08:00",
        expected_end_time: "2025-01-20T10:00",
        note: "การแข่งขันรอบเดียว",
        heat_name: "รุ่นทั่วไป ระยะ 10 กม.",
        lapCount: 10,
        currentLap: 10,
        elapsed: "00:55:10",
      },
    ],
    currentRoundId: "round-1",
  },
  "evt-003": {
    id: "evt-003",
    name: "Thailand National Race Walk Championship",
    date: "20 พฤษภาคม 2025",
    location: "สนามกีฬาแห่งชาติ",
    status: "scheduled",
    rounds: [
      {
        id: "round-1",
        name: "รอบคัดเลือก",
        status: "scheduled",
        distance_km: "10",
        scheduled_time: "2025-05-20T08:00",
        expected_end_time: "2025-05-20T10:30",
      },
    ],
  },
};

// TODO: ภายหลังจะใช้ eventId ไปดึงข้อมูลจริงจากฐานข้อมูล / realtime service
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
    {
      bib: "03",
      name: "Chanida Runfast",
      affiliation: "Chiangmai Racewalk Team",
      country: "THA",
      yellowCards: 0,
      redCards: 0,
      status: "OK",
      position: 3,
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
      bib: "03",
      name: "Chanida Runfast",
      affiliation: "Chiangmai Racewalk Team",
      country: "THA",
      yellowCards: 4,
      redCards: 0,
      status: "OK",
      position: 3,
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
    {
      bib: "05",
      name: "Mai Tanaka",
      affiliation: "Tokyo Walkers",
      country: "JPN",
      yellowCards: 0,
      redCards: 0,
      status: "OK",
      position: 5,
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
    {
      id: "J-03",
      name: "Coach C",
      position: "จุดเข้าเส้นชัย",
      zone: "Finish",
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
    {
      id: "J-03",
      name: "Coach C",
      position: "จุดเข้าเส้นชัย",
      zone: "Finish",
      roundId: "round-2",
    },
    {
      id: "J-04",
      name: "Coach D",
      position: "โค้งที่ 2",
      zone: "Zone C",
      roundId: "round-2",
    },
  ],
};

const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  // Round 1 activities
  {
    id: "log-001",
    timestamp: "2025-03-15T08:15:32",
    time: "08:15:32",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    roundId: "round-1",
    details: "Zone A - โค้งที่ 1",
  },
  {
    id: "log-002",
    timestamp: "2025-03-15T08:18:47",
    time: "08:18:47",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-1",
    details: "Zone B - ทางตรงฝั่งสแตนด์",
  },
  {
    id: "log-003",
    timestamp: "2025-03-15T08:25:09",
    time: "08:25:09",
    date: "15 มี.ค. 2025",
    actor: "Moderator",
    role: "moderator",
    action: "เริ่มรอบการแข่งขัน",
    actionType: "round_start",
    roundId: "round-1",
    details: "รอบคัดเลือก - ระยะ 10 กม.",
  },
  {
    id: "log-004",
    timestamp: "2025-03-15T10:30:15",
    time: "10:30:15",
    date: "15 มี.ค. 2025",
    actor: "Moderator",
    role: "moderator",
    action: "จบรอบการแข่งขัน",
    actionType: "round_end",
    roundId: "round-1",
    details: "รอบคัดเลือก - เสร็จสิ้น",
  },
  // Round 2 activities
  {
    id: "log-005",
    timestamp: "2025-03-15T14:05:12",
    time: "14:05:12",
    date: "15 มี.ค. 2025",
    actor: "Moderator",
    role: "moderator",
    action: "เริ่มรอบการแข่งขัน",
    actionType: "round_start",
    roundId: "round-2",
    details: "รอบชิงชนะเลิศ - ระยะ 20 กม.",
  },
  {
    id: "log-006",
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
  {
    id: "log-007",
    timestamp: "2025-03-15T14:18:47",
    time: "14:18:47",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-2",
    details: "Zone B - ทางตรงฝั่งสแตนด์",
  },
  {
    id: "log-008",
    timestamp: "2025-03-15T14:22:15",
    time: "14:22:15",
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
  {
    id: "log-009",
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
  },
  {
    id: "log-010",
    timestamp: "2025-03-15T14:26:30",
    time: "14:26:30",
    date: "15 มี.ค. 2025",
    actor: "Moderator",
    role: "moderator",
    action: "ยืนยันใบแดงจาก Judge ที่ Zone B",
    actionType: "red_card_confirm",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-2",
    details: "ยืนยันใบแดงจาก Coach B (Zone B)",
  },
  {
    id: "log-011",
    timestamp: "2025-03-15T14:30:45",
    time: "14:30:45",
    date: "15 มี.ค. 2025",
    actor: "Coach D",
    actorId: "J-04",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-2",
    details: "Zone C - โค้งที่ 2",
  },
  {
    id: "log-012",
    timestamp: "2025-03-15T14:35:20",
    time: "14:35:20",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-2",
    details: "Zone A - โค้งที่ 1",
  },
  {
    id: "log-013",
    timestamp: "2025-03-15T14:40:10",
    time: "14:40:10",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-2",
    details: "Zone B - ทางตรงฝั่งสแตนด์",
  },
  {
    id: "log-014",
    timestamp: "2025-03-15T14:42:30",
    time: "14:42:30",
    date: "15 มี.ค. 2025",
    actor: "Coach D",
    actorId: "J-04",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-2",
    details: "Zone C - โค้งที่ 2",
  },
  {
    id: "log-015",
    timestamp: "2025-03-15T14:45:00",
    time: "14:45:00",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-2",
    details: "Zone A - โค้งที่ 1",
  },
  {
    id: "log-016",
    timestamp: "2025-03-15T14:50:15",
    time: "14:50:15",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบแดง (สัญลักษณ์: ~)",
    actionType: "red_card",
    targetAthlete: "Luis Garcia",
    targetBib: "04",
    roundId: "round-2",
    details: "Zone B - ยกเท้า / เท้าไม่ติดพื้น",
  },
  {
    id: "log-017",
    timestamp: "2025-03-15T14:52:20",
    time: "14:52:20",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบแดง (สัญลักษณ์: >)",
    actionType: "red_card",
    targetAthlete: "Luis Garcia",
    targetBib: "04",
    roundId: "round-2",
    details: "Zone A - เข่างอ",
  },
];

export default function EventModeratorPage(
  props: EventModeratorPageProps,
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

  // Initialize selected round
  const displayRoundId = selectedRoundId || currentRound?.id || eventInfo?.rounds?.[0]?.id || null;
  const displayRound = eventInfo?.rounds?.find((r) => r.id === displayRoundId);

  // Get data for selected round
  const roundAthletes = displayRoundId ? MOCK_ATHLETES_BY_ROUND[displayRoundId] || [] : [];
  const roundJudges = displayRoundId ? MOCK_JUDGES_BY_ROUND[displayRoundId] || [] : [];
  const roundLogs = displayRoundId 
    ? MOCK_ACTIVITY_LOGS.filter((log) => log.roundId === displayRoundId).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    : [];

  // Calculate max cards based on number of judges
  // ใบเหลือง: กรรมการแต่ละคนให้ได้ 2 ใบ → สูงสุด 2 × จำนวนกรรมการ
  // ใบแดง: กรรมการแต่ละคนให้ได้ 1 ใบ → สูงสุด 1 × จำนวนกรรมการ
  const maxYellowCards = roundJudges.length * 2; // 2 ใบต่อกรรมการ
  const maxRedCards = roundJudges.length * 1; // 1 ใบต่อกรรมการ

  // Group logs by date
  const logsByDate = roundLogs.reduce((acc, log) => {
    const date = log.date || log.timestamp.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLogItem[]>);

  // Get card details for a specific athlete
  const getAthleteCardDetails = (bib: string) => {
    const athleteLogs = roundLogs.filter(
      (log) =>
        log.targetBib === bib &&
        (log.actionType === "yellow_card" ||
          log.actionType === "red_card" ||
          log.actionType === "red_card_confirm")
    );
    
    const yellowCards = athleteLogs.filter((log) => log.actionType === "yellow_card");
    const redCards = athleteLogs.filter(
      (log) => log.actionType === "red_card" || log.actionType === "red_card_confirm"
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
                Event Activity Log
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[eventInfo.status]}`}
              >
                ● {statusLabel[eventInfo.status]}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              ดู Log โดยละเอียดของการแข่งขัน:{" "}
              <span className="font-medium">{eventInfo.name}</span>
            </p>
            <p className="text-xs text-slate-500">
              {eventInfo.location} • {eventInfo.date}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/admin/events/${eventId}`}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 text-xs"
              >
                กลับไปหน้า Event
              </Button>
            </Link>
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
                    {displayRound.note && (
                      <p className="mt-1 text-xs text-slate-500">{displayRound.note}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    {displayRound.scheduled_time && (
                      <p className="text-slate-600">
                        เริ่ม:{" "}
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
                    {displayRound.expected_end_time && (
                      <p className="text-slate-600">
                        คาดว่าจะจบ:{" "}
                        <span className="font-medium">
                          {new Date(displayRound.expected_end_time).toLocaleString("th-TH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    )}
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
                      {roundJudges.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          กรรมการ {roundJudges.length} คน → ใบเหลืองสูงสุด {maxYellowCards} ใบ, ใบแดงสูงสุด {maxRedCards} ใบ
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {roundAthletes.length} คน
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left"></th>
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
                              <td className="px-3 py-2 text-center w-8">
                                <span className={`inline-flex items-center justify-center w-5 h-5 transition-transform ${
                                  isExpanded ? "rotate-90" : ""
                                }`}>
                                  <svg
                                    className="w-4 h-4 text-slate-400"
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
                                </span>
                              </td>
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
                                  {/* Yellow Cards */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-amber-700">
                                          Y {athlete.yellowCards}
                                        </span>
                                        {maxYellowCards > 0 && (
                                          <>
                                            <span className="text-[10px] text-slate-400">/</span>
                                            <span className="text-[10px] text-slate-500">
                                              {maxYellowCards}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      {athlete.yellowCards > 0 && (
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: Math.min(athlete.yellowCards, 8) }).map((_, i) => (
                                            <span
                                              key={i}
                                              className="h-2.5 w-2.5 rounded-full bg-amber-400"
                                              title={`ใบเหลือง ${i + 1}`}
                                            />
                                          ))}
                                          {athlete.yellowCards > 8 && (
                                            <span className="text-[8px] text-amber-600 font-medium leading-none">
                                              +{athlete.yellowCards - 8}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {maxYellowCards > 0 && (
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-amber-400 transition-all"
                                          style={{
                                            width: `${Math.min((athlete.yellowCards / maxYellowCards) * 100, 100)}%`,
                                          }}
                                          title={`${athlete.yellowCards} / ${maxYellowCards} ใบเหลือง`}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Red Cards */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-red-700">
                                          R {athlete.redCards}
                                        </span>
                                        {maxRedCards > 0 && (
                                          <>
                                            <span className="text-[10px] text-slate-400">/</span>
                                            <span className="text-[10px] text-slate-500">
                                              {maxRedCards}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      {athlete.redCards > 0 && (
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: Math.min(athlete.redCards, 8) }).map((_, i) => (
                                            <span
                                              key={i}
                                              className="h-2.5 w-2.5 rounded-full bg-red-500"
                                              title={`ใบแดง ${i + 1}`}
                                            />
                                          ))}
                                          {athlete.redCards > 8 && (
                                            <span className="text-[8px] text-red-600 font-medium leading-none">
                                              +{athlete.redCards - 8}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {maxRedCards > 0 && (
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-red-500 transition-all"
                                          style={{
                                            width: `${Math.min((athlete.redCards / maxRedCards) * 100, 100)}%`,
                                          }}
                                          title={`${athlete.redCards} / ${maxRedCards} ใบแดง`}
                                        />
                                      </div>
                                    )}
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
                                <td colSpan={6} className="px-3 py-4 bg-slate-50/50">
                                  <div className="space-y-4">
                                    {/* Yellow Cards Details */}
                                    {cardDetails.yellowCards.length > 0 ? (
                                      <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-amber-700 flex items-center gap-2">
                                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                            {cardDetails.yellowCards.length}
                                          </span>
                                          ใบเหลืองที่ได้รับ
                                        </h4>
                                        <div className="space-y-1.5 pl-7">
                                          {cardDetails.yellowCards.map((log, index) => {
                                            const judge = roundJudges.find(
                                              (j) => j.id === log.actorId
                                            );
                                            return (
                                              <div
                                                key={log.id}
                                                className="flex items-start gap-2 text-[11px] text-slate-700 bg-white rounded-lg border border-amber-200 px-3 py-2"
                                              >
                                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-slate-900">
                                                      ใบเหลือง #{index + 1}
                                                    </span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="font-mono text-[10px] text-slate-500">
                                                      {log.time}
                                                    </span>
                                                  </div>
                                                  <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-slate-600">
                                                      จาก: <span className="font-medium">{log.actor}</span>
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
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-slate-400 pl-7">
                                        ยังไม่ได้รับใบเหลือง
                                      </div>
                                    )}

                                    {/* Red Cards Details */}
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
                                            const isConfirmed = log.actionType === "red_card_confirm";
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
                            <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-500">
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
                      {roundJudges.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          กรรมการแต่ละคนให้ใบเหลืองได้ 2 ใบ/นักกีฬา, ใบแดงได้ 1 ใบ/นักกีฬา
                        </p>
                      )}
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
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {log.role === "judge" ? "Judge" : "Moderator"}
                                </span>
                                {log.actionType && (
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                      log.actionType === "yellow_card"
                                        ? "bg-amber-50 text-amber-700"
                                        : log.actionType === "red_card" || log.actionType === "red_card_confirm"
                                          ? "bg-red-50 text-red-700"
                                          : log.actionType === "round_start"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : log.actionType === "round_end"
                                              ? "bg-slate-100 text-slate-700"
                                              : "bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    {log.actionType === "yellow_card"
                                      ? "ใบเหลือง"
                                      : log.actionType === "red_card"
                                        ? "ใบแดง"
                                        : log.actionType === "red_card_confirm"
                                          ? "ยืนยันใบแดง"
                                          : log.actionType === "round_start"
                                            ? "เริ่มรอบ"
                                            : log.actionType === "round_end"
                                              ? "จบรอบ"
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

              <p className="border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500">
                * ข้อมูล activity log ตอนนี้เป็นตัวอย่างจำลอง – ในอนาคตจะดึงจาก
                ระบบบันทึกเหตุการณ์จริง (real-time event stream) ของกรรมการและ
                moderator
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

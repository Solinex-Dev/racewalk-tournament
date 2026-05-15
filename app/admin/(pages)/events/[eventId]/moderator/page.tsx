"use client";

import { use, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  symbol?: "~" | ">";
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
      yellowCards: 3,
      redCards: 1,
      status: "OK",
      position: 1,
    },
    {
      bib: "02",
      name: "Jane Doe",
      affiliation: "Example Athletic Club",
      country: "USA",
      yellowCards: 3,
      redCards: 0,
      status: "OK",
      position: 2,
    },
    {
      bib: "03",
      name: "Chanida Runfast",
      affiliation: "Chiangmai Racewalk Team",
      country: "THA",
      yellowCards: 2,
      redCards: 1,
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
    {
      id: "J-04",
      name: "Coach D",
      position: "โค้งที่ 2",
      zone: "Zone C",
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
    details: "เข่างอ",
    symbol: ">",
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
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-018",
    timestamp: "2025-03-15T08:30:20",
    time: "08:30:20",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-1",
    details: "เข่างอ",
    symbol: ">",
  },
  {
    id: "log-019",
    timestamp: "2025-03-15T08:35:45",
    time: "08:35:45",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    roundId: "round-1",
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-020",
    timestamp: "2025-03-15T08:45:10",
    time: "08:45:10",
    date: "15 มี.ค. 2025",
    actor: "Coach D",
    actorId: "J-04",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-1",
    details: "เข่างอ",
    symbol: ">",
  },
  {
    id: "log-021",
    timestamp: "2025-03-15T08:50:30",
    time: "08:50:30",
    date: "15 มี.ค. 2025",
    actor: "Coach C",
    actorId: "J-03",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    roundId: "round-1",
    details: "เข่างอ",
    symbol: ">",
  },
  {
    id: "log-022",
    timestamp: "2025-03-15T09:05:15",
    time: "09:05:15",
    date: "15 มี.ค. 2025",
    actor: "Coach D",
    actorId: "J-04",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-1",
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-023",
    timestamp: "2025-03-15T09:15:20",
    time: "09:15:20",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบเหลือง",
    actionType: "yellow_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-1",
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-024",
    timestamp: "2025-03-15T09:25:40",
    time: "09:25:40",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบแดง",
    actionType: "red_card",
    targetAthlete: "Chanida Runfast",
    targetBib: "03",
    roundId: "round-1",
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-025",
    timestamp: "2025-03-15T09:35:10",
    time: "09:35:10",
    date: "15 มี.ค. 2025",
    actor: "Coach D",
    actorId: "J-04",
    role: "judge",
    action: "ให้ใบแดง",
    actionType: "red_card",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    roundId: "round-1",
    details: "เข่างอ",
    symbol: ">",
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
    details: "เข่างอ",
    symbol: ">",
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
    details: "เท้าลอย",
    symbol: "~",
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
    details: "เข่างอ",
    symbol: ">",
  },
  {
    id: "log-009",
    timestamp: "2025-03-15T14:25:09",
    time: "14:25:09",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบแดง",
    actionType: "red_card",
    targetAthlete: "Jane Doe",
    targetBib: "02",
    roundId: "round-2",
    details: "เข่างอ",
    symbol: ">",
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
    details: "เท้าลอย",
    symbol: "~",
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
    details: "เข่างอ",
    symbol: ">",
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
    details: "เท้าลอย",
    symbol: "~",
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
    details: "เข่างอ",
    symbol: ">",
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
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-016",
    timestamp: "2025-03-15T14:50:15",
    time: "14:50:15",
    date: "15 มี.ค. 2025",
    actor: "Coach B",
    actorId: "J-02",
    role: "judge",
    action: "ให้ใบแดง",
    actionType: "red_card",
    targetAthlete: "Luis Garcia",
    targetBib: "04",
    roundId: "round-2",
    details: "เท้าลอย",
    symbol: "~",
  },
  {
    id: "log-017",
    timestamp: "2025-03-15T14:52:20",
    time: "14:52:20",
    date: "15 มี.ค. 2025",
    actor: "Coach A",
    actorId: "J-01",
    role: "judge",
    action: "ให้ใบแดง",
    actionType: "red_card",
    targetAthlete: "Luis Garcia",
    targetBib: "04",
    roundId: "round-2",
    details: "เข่างอ",
    symbol: ">",
  },
];

type PendingRedCard = {
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

const MOCK_PENDING: PendingRedCard[] = [
  {
    id: "pending-001",
    roundId: "round-2",
    judgeId: "J-01",
    judgeName: "Coach A",
    judgeZone: "Zone A",
    targetBib: "04",
    targetAthlete: "Luis Garcia",
    symbol: "~",
    time: "14:58:30",
  },
  {
    id: "pending-002",
    roundId: "round-2",
    judgeId: "J-02",
    judgeName: "Coach B",
    judgeZone: "Zone B",
    targetBib: "02",
    targetAthlete: "Jane Doe",
    symbol: ">",
    time: "15:01:15",
  },
];

export default function EventModeratorPage(
  props: EventModeratorPageProps,
) {
  const { eventId } = use(props.params);
  const eventInfo = MOCK_EVENT_STATUS[eventId];
  const router = useRouter();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [expandedJudgeIds, setExpandedJudgeIds] = useState<Set<string>>(new Set());
  const [pendingRedCards, setPendingRedCards] = useState<PendingRedCard[]>(MOCK_PENDING);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportRound, setSelectedExportRound] = useState<string | null>(null);
  const [selectedExportAthlete, setSelectedExportAthlete] = useState<string>("all");
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  const handleConfirmRedCard = (id: string) => {
    setPendingRedCards((prev) => prev.filter((c) => c.id !== id));
    // TODO: ส่ง API ยืนยันใบแดง
  };

  const handleRejectRedCard = (id: string) => {
    setPendingRedCards((prev) => prev.filter((c) => c.id !== id));
    // TODO: ส่ง API ปฏิเสธใบแดง
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
  const roundPendingCards = displayRoundId
    ? pendingRedCards.filter((p) => p.roundId === displayRoundId)
    : [];
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
    <>
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
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
            <button
              type="button"
              onClick={() => {
                setSelectedExportRound(displayRoundId);
                setIsExportModalOpen(true);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
            >
              ส่งออกข้อมูล
            </button>
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
            <CardContent className="p-5">
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
              <CardContent className="p-6">
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
                  <div className="flex flex-col items-end gap-2 text-xs">
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
                    {displayRound.status === "finished" && (
                      <button
                        type="button"
                        onClick={() => setShowEditConfirm(true)}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        แก้ไขข้อมูลรอบนี้
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Judges Overview */}
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">กรรมการในรอบนี้</h2>
                    <p className="text-xs text-slate-500">กดที่ชื่อกรรมการเพื่อดูใบที่ให้</p>
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
                      {roundJudges.length > 0 ? (
                        roundJudges.map((judge) => {
                          const isExpanded = expandedJudgeIds.has(judge.id);
                          const { yellowCards, redCards } = getJudgeLogs(judge.id);
                          const maxY = roundAthletes.length * 2;
                          const maxR = roundAthletes.length;
                          const judgePending = roundPendingCards.filter((p) => p.judgeId === judge.id);
                          const hasPending = judgePending.length > 0;
                          return (
                            <Fragment key={judge.id}>
                              <tr
                                className={`cursor-pointer transition-colors ${
                                  hasPending
                                    ? "bg-red-50 hover:bg-red-100/70"
                                    : isExpanded
                                    ? "bg-slate-50 hover:bg-slate-50/70"
                                    : "hover:bg-slate-50/70"
                                }`}
                                onClick={() => toggleJudge(judge.id)}
                              >
                                <td className="w-10 px-4 py-4 text-center">
                                  <svg
                                    className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{judge.name}</span>
                                    {hasPending && (
                                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                        {judgePending.length} รอยืนยัน
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-slate-600">{judge.position}</td>

                                {/* ใบเหลือง — dots + progress bar */}
                                <td className="px-4 py-4">
                                  <div className="min-w-[140px] space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-amber-700">
                                          Y {yellowCards.length}
                                        </span>
                                        {maxY > 0 && (
                                          <span className="text-[10px] text-slate-400">/ {maxY}</span>
                                        )}
                                      </div>
                                      {yellowCards.length > 0 && (
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: Math.min(yellowCards.length, 8) }).map((_, i) => (
                                            <span key={i} className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                          ))}
                                          {yellowCards.length > 8 && (
                                            <span className="text-[8px] font-medium leading-none text-amber-600">
                                              +{yellowCards.length - 8}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {maxY > 0 && (
                                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                          className="h-full bg-amber-400 transition-all"
                                          style={{ width: `${Math.min((yellowCards.length / maxY) * 100, 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* ใบแดง — dots + progress bar */}
                                <td className="px-4 py-4">
                                  <div className="min-w-[140px] space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-red-700">
                                          R {redCards.length}
                                        </span>
                                        {maxR > 0 && (
                                          <span className="text-[10px] text-slate-400">/ {maxR}</span>
                                        )}
                                      </div>
                                      {redCards.length > 0 && (
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: Math.min(redCards.length, 8) }).map((_, i) => (
                                            <span key={i} className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                          ))}
                                          {redCards.length > 8 && (
                                            <span className="text-[8px] font-medium leading-none text-red-600">
                                              +{redCards.length - 8}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {maxR > 0 && (
                                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                          className="h-full bg-red-500 transition-all"
                                          style={{ width: `${Math.min((redCards.length / maxR) * 100, 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-slate-50/60 px-8 py-6">
                                    <div className="space-y-7">
                                      {/* ใบแดงรอยืนยัน */}
                                      {judgePending.length > 0 && (
                                        <div className="space-y-2">
                                          <h4 className="flex items-center gap-2 text-xs font-semibold text-red-700">
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                              {judgePending.length}
                                            </span>
                                            ใบแดงรอยืนยัน
                                          </h4>
                                          <div className="space-y-3">
                                            {judgePending.map((pending) => (
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
                                                <div className="flex gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleRejectRedCard(pending.id); }}
                                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                                                  >
                                                    ปฏิเสธ
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleConfirmRedCard(pending.id); }}
                                                    className="rounded-lg border border-red-500 bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 active:bg-red-700"
                                                  >
                                                    ยืนยัน
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* ใบเหลือง */}
                                      <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                                            {yellowCards.length}
                                          </span>
                                          ใบเหลืองที่ให้
                                        </h4>
                                        {yellowCards.length > 0 ? (
                                          <div className="overflow-hidden rounded-lg border border-amber-200">
                                            <table className="min-w-full text-[11px]">
                                              <thead className="bg-amber-50 text-[10px] font-medium uppercase text-amber-700">
                                                <tr>
                                                  <th className="px-4 py-3 text-left">Bib</th>
                                                  <th className="px-4 py-3 text-left">นักกีฬา</th>
                                                  <th className="px-4 py-3 text-left">เวลา</th>
                                                  <th className="px-4 py-3 text-left">ลักษณะความผิด</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-amber-100 bg-white">
                                                {yellowCards.map((log) => (
                                                  <tr key={log.id} className="hover:bg-amber-50/40">
                                                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                                      {log.targetBib ?? "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-800">
                                                      {log.targetAthlete ?? "-"}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">
                                                      {log.time}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <div className="flex items-center gap-2">
                                                        {log.symbol && (
                                                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-mono text-[10px] font-bold text-white">
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
                                          <p className="text-xs text-slate-400">ยังไม่ได้ให้ใบเหลือง</p>
                                        )}
                                      </div>

                                      {/* ใบแดง */}
                                      <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-semibold text-red-700">
                                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700">
                                            {redCards.length}
                                          </span>
                                          ใบแดงที่ให้
                                        </h4>
                                        {redCards.length > 0 ? (
                                          <div className="overflow-hidden rounded-lg border border-red-200">
                                            <table className="min-w-full text-[11px]">
                                              <thead className="bg-red-50 text-[10px] font-medium uppercase text-red-700">
                                                <tr>
                                                  <th className="px-4 py-3 text-left">Bib</th>
                                                  <th className="px-4 py-3 text-left">นักกีฬา</th>
                                                  <th className="px-4 py-3 text-left">เวลา</th>
                                                  <th className="px-4 py-3 text-left">ลักษณะความผิด</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-red-100 bg-white">
                                                {redCards.map((log) => (
                                                  <tr key={log.id} className="hover:bg-red-50/40">
                                                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                                      {log.targetBib ?? "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-800">
                                                      {log.targetAthlete ?? "-"}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">
                                                      {log.time}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <div className="flex items-center gap-2">
                                                        {log.symbol && (
                                                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
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
                                          <p className="text-xs text-slate-400">ยังไม่ได้ให้ใบแดง</p>
                                        )}
                                      </div>
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
                            ยังไม่มีข้อมูลกรรมการในรอบนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Activity Log */}
        {displayRound && (
          <Card className="rounded-2xl border-slate-200">
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
                          <li key={log.id} className="flex gap-4 px-6 py-5 hover:bg-slate-50/50">
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
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  {log.symbol && (
                                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white ${
                                      log.actionType === "yellow_card" ? "bg-amber-400" : "bg-red-500"
                                    }`}>
                                      {log.symbol}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-slate-500">{log.details}</p>
                                </div>
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

              <p className="border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500">
                * ข้อมูล activity log ตอนนี้เป็นตัวอย่างจำลอง – ในอนาคตจะดึงจาก
                ระบบบันทึกเหตุการณ์จริง (real-time event stream) ของกรรมการและ
                moderator
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">ส่งออกข้อมูล</h2>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                ส่งออกผลการแข่งขัน ใบเตือน ใบแดง และข้อมูลกรรมการ
              </p>

              {/* Round Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">เลือกรอบการแข่งขัน</label>
                <select
                  value={selectedExportRound || ""}
                  onChange={(e) => setSelectedExportRound(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {eventInfo?.rounds?.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                      {round.distance_km && ` (${round.distance_km} กม.)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Athlete Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">เลือกข้อมูล</label>
                <select
                  value={selectedExportAthlete}
                  onChange={(e) => setSelectedExportAthlete(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">
                    นักกีฬาทั้งหมด (
                    {selectedExportRound
                      ? MOCK_ATHLETES_BY_ROUND[selectedExportRound]?.length || 0
                      : roundAthletes.length}{" "}
                    คน)
                  </option>
                  <optgroup label="นักกีฬาเฉพาะตัว">
                    {(selectedExportRound
                      ? MOCK_ATHLETES_BY_ROUND[selectedExportRound] || []
                      : roundAthletes
                    ).map((athlete) => (
                      <option key={athlete.bib} value={athlete.bib}>
                        {athlete.bib} – {athlete.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 active:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📄 PDF
                </button>
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 active:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📊 Excel
                </button>
              </div>

              <p className="text-[10px] text-slate-500">
                รวมข้อมูล: BIB / ชื่อ / สถานะ / ใบเหลือง / ใบแดง / กรรมการที่ให้ / ตำแหน่ง
              </p>
            </div>
          </div>
        </div>
      )}
    </main>

    {/* Confirm before entering edit mode */}
    {showEditConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">ยืนยันการแก้ไขข้อมูล</h2>
            <button
              type="button"
              onClick={() => setShowEditConfirm(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-600">
              คุณกำลังจะเข้าสู่โหมดแก้ไขข้อมูลรอบนี้ การเปลี่ยนแปลงจะถูกบันทึกเป็น audit log โดย Moderator
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditConfirm(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditConfirm(false);
                  router.push(`/admin/events/${eventId}/moderator/edit?round=${displayRoundId}`);
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

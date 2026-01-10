"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EventLoggerPageProps = {
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

type AthleteLapTime = {
  bib: string;
  name: string;
  affiliation: string;
  country?: string;
  laps: {
    lapNumber: number;
    time: string;
    timestamp: string;
  }[];
  finishTime?: string;
  finishPosition?: number;
  status?: "OK" | "DQ" | "DNF";
};

type ActivityLogItem = {
  id: string;
  timestamp: string;
  time: string;
  date?: string;
  actor: string;
  role: "event_logger" | "judge" | "moderator";
  action: string;
  actionType?: "lap_time" | "finish_time" | "round_start" | "round_end" | "other";
  targetAthlete?: string;
  targetBib?: string;
  lapNumber?: number;
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
};

const MOCK_ATHLETES_BY_ROUND: Record<string, AthleteLapTime[]> = {
  "round-1": [
    {
      bib: "01",
      name: "Somchai Rakdee",
      affiliation: "ชมรมเดินทนกรุงเทพฯ",
      country: "THA",
      laps: [
        { lapNumber: 1, time: "05:12", timestamp: "2025-03-15T08:05:12" },
        { lapNumber: 2, time: "05:15", timestamp: "2025-03-15T08:10:27" },
        { lapNumber: 3, time: "05:18", timestamp: "2025-03-15T08:15:45" },
      ],
      finishTime: "00:52:30",
      finishPosition: 1,
      status: "OK",
    },
    {
      bib: "02",
      name: "Jane Doe",
      affiliation: "Example Athletic Club",
      country: "USA",
      laps: [
        { lapNumber: 1, time: "05:20", timestamp: "2025-03-15T08:05:20" },
        { lapNumber: 2, time: "05:22", timestamp: "2025-03-15T08:10:42" },
      ],
      finishTime: "00:53:10",
      finishPosition: 2,
      status: "OK",
    },
  ],
  "round-2": [
    {
      bib: "01",
      name: "Somchai Rakdee",
      affiliation: "ชมรมเดินทนกรุงเทพฯ",
      country: "THA",
      laps: [
        { lapNumber: 1, time: "02:14", timestamp: "2025-03-15T14:02:14" },
        { lapNumber: 2, time: "02:16", timestamp: "2025-03-15T14:04:30" },
        { lapNumber: 3, time: "02:18", timestamp: "2025-03-15T14:06:48" },
        { lapNumber: 4, time: "02:15", timestamp: "2025-03-15T14:09:03" },
        { lapNumber: 5, time: "02:17", timestamp: "2025-03-15T14:11:20" },
        { lapNumber: 6, time: "02:19", timestamp: "2025-03-15T14:13:39" },
        { lapNumber: 7, time: "02:16", timestamp: "2025-03-15T14:15:55" },
      ],
      status: "OK",
    },
    {
      bib: "02",
      name: "Jane Doe",
      affiliation: "Example Athletic Club",
      country: "USA",
      laps: [
        { lapNumber: 1, time: "02:18", timestamp: "2025-03-15T14:02:18" },
        { lapNumber: 2, time: "02:20", timestamp: "2025-03-15T14:04:38" },
        { lapNumber: 3, time: "02:22", timestamp: "2025-03-15T14:07:00" },
        { lapNumber: 4, time: "02:19", timestamp: "2025-03-15T14:09:19" },
        { lapNumber: 5, time: "02:21", timestamp: "2025-03-15T14:11:40" },
        { lapNumber: 6, time: "02:23", timestamp: "2025-03-15T14:14:03" },
      ],
      status: "OK",
    },
  ],
};

const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "log-001",
    timestamp: "2025-03-15T14:02:14",
    time: "14:02:14",
    date: "15 มี.ค. 2025",
    actor: "Event Logger",
    role: "event_logger",
    action: "บันทึก Lap 1",
    actionType: "lap_time",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    lapNumber: 1,
    roundId: "round-2",
    details: "เวลา: 02:14",
  },
  {
    id: "log-002",
    timestamp: "2025-03-15T14:04:30",
    time: "14:04:30",
    date: "15 มี.ค. 2025",
    actor: "Event Logger",
    role: "event_logger",
    action: "บันทึก Lap 2",
    actionType: "lap_time",
    targetAthlete: "Somchai Rakdee",
    targetBib: "01",
    lapNumber: 2,
    roundId: "round-2",
    details: "เวลา: 02:16",
  },
];

export default function EventLoggerPage(
  props: EventLoggerPageProps,
) {
  const { eventId } = use(props.params);
  const eventInfo = MOCK_EVENT_STATUS[eventId];
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedBib, setSelectedBib] = useState<string>("");
  const [lapTime, setLapTime] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

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
  const roundLogs = displayRoundId 
    ? MOCK_ACTIVITY_LOGS.filter((log) => log.roundId === displayRoundId).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    : [];

  const logsByDate = roundLogs.reduce((acc, log) => {
    const date = log.date || log.timestamp.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLogItem[]>);

  const handleStartStopwatch = () => {
    if (!isRecording) {
      setIsRecording(true);
      const start = Date.now();
      setStartTime(start);
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setElapsedTime(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setIsRecording(false);
      setStartTime(null);
      setElapsedTime("00:00:00");
    }
  };

  const handleRecordLap = () => {
    if (!selectedBib || !displayRoundId) {
      alert("กรุณาเลือกนักกีฬาและรอบก่อน");
      return;
    }
    if (!lapTime && !isRecording) {
      alert("กรุณากรอกเวลาหรือเริ่มจับเวลาก่อน");
      return;
    }

    const timeToRecord = lapTime || elapsedTime;
    // TODO: ภายหลังเชื่อมต่อ API
    alert(`บันทึก Lap สำหรับ Bib ${selectedBib} เวลา ${timeToRecord} เรียบร้อย (mock)`);
    setLapTime("");
    if (isRecording) {
      setStartTime(Date.now());
      setElapsedTime("00:00:00");
    }
  };

  const handleRecordFinish = () => {
    if (!selectedBib || !displayRoundId) {
      alert("กรุณาเลือกนักกีฬาและรอบก่อน");
      return;
    }
    if (!lapTime && !isRecording) {
      alert("กรุณากรอกเวลาหรือเริ่มจับเวลาก่อน");
      return;
    }

    const timeToRecord = lapTime || elapsedTime;
    // TODO: ภายหลังเชื่อมต่อ API
    alert(`บันทึกเวลาเข้าเส้นชัยสำหรับ Bib ${selectedBib} เวลา ${timeToRecord} เรียบร้อย (mock)`);
    setLapTime("");
    setIsRecording(false);
    setStartTime(null);
    setElapsedTime("00:00:00");
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
                หน้าจับเวลาและบันทึก Lap Time
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[eventInfo.status]}`}
              >
                ● {statusLabel[eventInfo.status]}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              จับเวลาและบันทึกลำดับการเข้าเส้นชัย และบันทึก lap แต่ละรอบของนักกีฬา:{" "}
              <span className="font-medium">{eventInfo.name}</span>
            </p>
            <p className="text-xs text-slate-500">
              {eventInfo.location} • {eventInfo.date}
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
            {/* Timer and Recording Controls */}
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  จับเวลาและบันทึก
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">
                        เลือกนักกีฬา (Bib Number)
                      </label>
                      <Input
                        value={selectedBib}
                        onChange={(e) => setSelectedBib(e.target.value)}
                        placeholder="เช่น 01, 02, 03"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">
                        เวลา (รูปแบบ MM:SS หรือ HH:MM:SS)
                      </label>
                      <Input
                        value={lapTime}
                        onChange={(e) => setLapTime(e.target.value)}
                        placeholder="เช่น 02:15 หรือ 00:02:15"
                        className="font-mono"
                        disabled={isRecording}
                      />
                      <p className="text-[11px] text-slate-500">
                        หรือใช้จับเวลาอัตโนมัติด้านล่าง
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">
                        จับเวลาอัตโนมัติ
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                          <div className="font-mono text-3xl font-bold text-slate-900">
                            {elapsedTime}
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleStartStopwatch}
                          className={`rounded-lg px-4 py-2 ${
                            isRecording
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {isRecording ? "หยุด" : "เริ่ม"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleRecordLap}
                        disabled={!selectedBib || (!lapTime && !isRecording)}
                        className="flex-1 rounded-lg"
                      >
                        บันทึก Lap
                      </Button>
                      <Button
                        type="button"
                        onClick={handleRecordFinish}
                        disabled={!selectedBib || (!lapTime && !isRecording)}
                        variant="outline"
                        className="flex-1 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        บันทึกเข้าเส้นชัย
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Athletes Lap Times */}
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      เวลา Lap ของนักกีฬา - {displayRound.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      ดู log หน้างานและเวลาที่บันทึกไว้
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
                        <th className="px-3 py-2 text-center">Lap Times</th>
                        <th className="px-3 py-2 text-center">เวลาเข้าเส้นชัย</th>
                        <th className="px-3 py-2 text-center">ลำดับ</th>
                        <th className="px-3 py-2 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {roundAthletes.length > 0 ? (
                        roundAthletes.map((athlete) => (
                          <tr key={athlete.bib} className="hover:bg-slate-50/70">
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
                              <div className="flex flex-wrap gap-1">
                                {athlete.laps.map((lap) => (
                                  <span
                                    key={lap.lapNumber}
                                    className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-mono text-sky-700"
                                  >
                                    L{lap.lapNumber}: {lap.time}
                                  </span>
                                ))}
                                {athlete.laps.length === 0 && (
                                  <span className="text-[10px] text-slate-400">
                                    ยังไม่มีข้อมูล
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center font-mono text-slate-900">
                              {athlete.finishTime || "-"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {athlete.finishPosition ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                  {athlete.finishPosition}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-3 py-4 text-center text-xs text-slate-500">
                            ยังไม่มีข้อมูลนักกีฬาในรอบนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Activity Log - {displayRound.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      บันทึกการจับเวลาและบันทึก Lap Time
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {roundLogs.length} เหตุการณ์
                  </span>
                </div>

                <div className="max-h-[400px] overflow-auto">
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
                                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 shrink-0">
                                    Event Logger
                                  </span>
                                  {log.actionType && (
                                    <span
                                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                        log.actionType === "lap_time"
                                          ? "bg-sky-50 text-sky-700"
                                          : log.actionType === "finish_time"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-slate-50 text-slate-600"
                                      }`}
                                    >
                                      {log.actionType === "lap_time"
                                        ? "Lap Time"
                                        : log.actionType === "finish_time"
                                          ? "Finish Time"
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
                                  {log.lapNumber && (
                                    <span className="ml-1 text-slate-500">
                                      (Lap {log.lapNumber})
                                    </span>
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
          </>
        )}
      </div>
    </main>
  );
}


"use client";

import { use, useState, Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ round?: string }>;
};

type RoundInfo = {
  id: string;
  name: string;
  status: "scheduled" | "ongoing" | "finished";
  distance_km?: string;
  heat_name?: string;
  scheduled_time?: string;
  expected_end_time?: string;
  lapCount?: number;
  currentLap?: number;
  elapsed?: string;
  note?: string;
};

type EventInfo = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: "scheduled" | "ongoing" | "finished";
  rounds: RoundInfo[];
};

type JudgeSummary = {
  id: string;
  name: string;
  position: string;
};

type CardEntry = {
  id: string;
  judgeId: string;
  targetBib: string;
  targetAthlete: string;
  type: "yellow" | "red";
  symbol?: "~" | ">";
  time: string;
  details: string;
  deleted: boolean;
};

// ── Mock data (mirrors moderator page) ──────────────────────────────────────

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
        heat_name: "รุ่นทั่วไป ระยะ 10 กม.",
        scheduled_time: "2025-03-15T08:00",
        expected_end_time: "2025-03-15T10:30",
        lapCount: 10,
        currentLap: 10,
        elapsed: "00:52:30",
        note: "รอบแรกสำหรับคัดเลือก",
      },
      {
        id: "round-2",
        name: "รอบชิงชนะเลิศ",
        status: "finished",
        distance_km: "20",
        heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
        scheduled_time: "2025-03-15T14:00",
        expected_end_time: "2025-03-15T17:00",
        lapCount: 20,
        currentLap: 20,
        elapsed: "01:52:20",
      },
    ],
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
        heat_name: "รุ่นทั่วไป ระยะ 10 กม.",
        scheduled_time: "2025-01-20T08:00",
        expected_end_time: "2025-01-20T10:00",
        lapCount: 10,
        currentLap: 10,
        elapsed: "00:55:10",
      },
    ],
  },
};

const MOCK_JUDGES_BY_ROUND: Record<string, JudgeSummary[]> = {
  "round-1": [
    { id: "J-01", name: "Coach A", position: "โค้งที่ 1" },
    { id: "J-02", name: "Coach B", position: "ทางตรงฝั่งสแตนด์" },
    { id: "J-03", name: "Coach C", position: "จุดเข้าเส้นชัย" },
    { id: "J-04", name: "Coach D", position: "โค้งที่ 2" },
  ],
  "round-2": [
    { id: "J-01", name: "Coach A", position: "โค้งที่ 1" },
    { id: "J-02", name: "Coach B", position: "ทางตรงฝั่งสแตนด์" },
    { id: "J-03", name: "Coach C", position: "จุดเข้าเส้นชัย" },
    { id: "J-04", name: "Coach D", position: "โค้งที่ 2" },
  ],
};

const MOCK_ATHLETE_COUNT_BY_ROUND: Record<string, number> = {
  "round-1": 3,
  "round-2": 5,
};


const MOCK_CARDS_BY_ROUND: Record<string, CardEntry[]> = {
  "round-1": [
    { id: "log-001", judgeId: "J-01", targetBib: "01", targetAthlete: "Somchai Rakdee",  type: "yellow", symbol: ">", time: "08:15:32", details: "เข่างอ",   deleted: false },
    { id: "log-002", judgeId: "J-02", targetBib: "02", targetAthlete: "Jane Doe",        type: "yellow", symbol: "~", time: "08:18:47", details: "เท้าลอย", deleted: false },
    { id: "log-018", judgeId: "J-01", targetBib: "02", targetAthlete: "Jane Doe",        type: "yellow", symbol: ">", time: "08:30:20", details: "เข่างอ",   deleted: false },
    { id: "log-019", judgeId: "J-02", targetBib: "01", targetAthlete: "Somchai Rakdee",  type: "yellow", symbol: "~", time: "08:35:45", details: "เท้าลอย", deleted: false },
    { id: "log-020", judgeId: "J-04", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: ">", time: "08:45:10", details: "เข่างอ",   deleted: false },
    { id: "log-021", judgeId: "J-03", targetBib: "01", targetAthlete: "Somchai Rakdee",  type: "yellow", symbol: ">", time: "08:50:30", details: "เข่างอ",   deleted: false },
    { id: "log-022", judgeId: "J-04", targetBib: "02", targetAthlete: "Jane Doe",        type: "yellow", symbol: "~", time: "09:05:15", details: "เท้าลอย", deleted: false },
    { id: "log-023", judgeId: "J-01", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: "~", time: "09:15:20", details: "เท้าลอย", deleted: false },
    { id: "log-024", judgeId: "J-02", targetBib: "03", targetAthlete: "Chanida Runfast", type: "red",    symbol: "~", time: "09:25:40", details: "เท้าลอย", deleted: false },
    { id: "log-025", judgeId: "J-04", targetBib: "01", targetAthlete: "Somchai Rakdee",  type: "red",    symbol: ">", time: "09:35:10", details: "เข่างอ",   deleted: false },
  ],
  "round-2": [
    { id: "log-006", judgeId: "J-01", targetBib: "01", targetAthlete: "Somchai Rakdee",  type: "yellow", symbol: ">", time: "14:15:32", details: "เข่างอ",   deleted: false },
    { id: "log-007", judgeId: "J-02", targetBib: "02", targetAthlete: "Jane Doe",        type: "yellow", symbol: "~", time: "14:18:47", details: "เท้าลอย", deleted: false },
    { id: "log-008", judgeId: "J-01", targetBib: "01", targetAthlete: "Somchai Rakdee",  type: "yellow", symbol: ">", time: "14:22:15", details: "เข่างอ",   deleted: false },
    { id: "log-009", judgeId: "J-02", targetBib: "02", targetAthlete: "Jane Doe",        type: "red",    symbol: ">", time: "14:25:09", details: "เข่างอ",   deleted: false },
    { id: "log-011", judgeId: "J-04", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: "~", time: "14:30:45", details: "เท้าลอย", deleted: false },
    { id: "log-012", judgeId: "J-01", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: ">", time: "14:35:20", details: "เข่างอ",   deleted: false },
    { id: "log-013", judgeId: "J-02", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: "~", time: "14:40:10", details: "เท้าลอย", deleted: false },
    { id: "log-014", judgeId: "J-04", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: ">", time: "14:42:30", details: "เข่างอ",   deleted: false },
    { id: "log-015", judgeId: "J-01", targetBib: "03", targetAthlete: "Chanida Runfast", type: "yellow", symbol: "~", time: "14:45:00", details: "เท้าลอย", deleted: false },
    { id: "log-016", judgeId: "J-02", targetBib: "04", targetAthlete: "Luis Garcia",     type: "red",    symbol: "~", time: "14:50:15", details: "เท้าลอย", deleted: false },
    { id: "log-017", judgeId: "J-01", targetBib: "04", targetAthlete: "Luis Garcia",     type: "red",    symbol: ">", time: "14:52:20", details: "เข่างอ",   deleted: false },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ModeratorEditPage(props: Props) {
  const { eventId } = use(props.params);
  const { round: roundParam } = use(props.searchParams);

  const eventInfo = MOCK_EVENT_STATUS[eventId];
  const finishedRounds = eventInfo?.rounds?.filter((r) => r.status === "finished") ?? [];

  const selectedRoundId =
    roundParam && finishedRounds.some((r) => r.id === roundParam)
      ? roundParam
      : finishedRounds[0]?.id ?? null;

  const [cards, setCards] = useState<Record<string, CardEntry[]>>(() => {
    const result: Record<string, CardEntry[]> = {};
    for (const round of finishedRounds) {
      result[round.id] = (MOCK_CARDS_BY_ROUND[round.id] ?? []).map((c) => ({ ...c }));
    }
    return result;
  });
  const [expandedJudgeIds, setExpandedJudgeIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ time: string; details: string; symbol?: "~" | ">" }>({ time: "", details: "" });
  const [isDirty, setIsDirty] = useState(false);

  const displayRound = eventInfo?.rounds?.find((r) => r.id === selectedRoundId);
  const roundCards = selectedRoundId ? (cards[selectedRoundId] ?? []) : [];
  const roundJudges = selectedRoundId ? (MOCK_JUDGES_BY_ROUND[selectedRoundId] ?? []) : [];
  const athleteCount = selectedRoundId ? (MOCK_ATHLETE_COUNT_BY_ROUND[selectedRoundId] ?? 0) : 0;
  const maxY = athleteCount * 2;
  const maxR = athleteCount;

  const toggleJudge = (judgeId: string) => {
    setExpandedJudgeIds((prev) => {
      const next = new Set(prev);
      if (next.has(judgeId)) next.delete(judgeId);
      else next.add(judgeId);
      return next;
    });
  };

  const getJudgeCards = (judgeId: string) => {
    const active = roundCards.filter((c) => c.judgeId === judgeId && !c.deleted);
    return {
      yellowCards: active.filter((c) => c.type === "yellow"),
      redCards: active.filter((c) => c.type === "red"),
    };
  };

  const startEdit = (card: CardEntry) => {
    setEditingId(card.id);
    setEditDraft({ time: card.time, details: card.details, symbol: card.symbol });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ time: "", details: "" });
  };

  const confirmEdit = (id: string) => {
    if (!selectedRoundId) return;
    setCards((prev) => ({
      ...prev,
      [selectedRoundId]: prev[selectedRoundId].map((c) => {
        if (c.id !== id) return c;
        const patch = { ...editDraft };
        patch.symbol = patch.details === "เท้าลอย" ? "~" : ">";
        return { ...c, ...patch };
      }),
    }));
    setIsDirty(true);
    cancelEdit();
  };

  const deleteCard = (id: string) => {
    if (!selectedRoundId) return;
    setCards((prev) => ({
      ...prev,
      [selectedRoundId]: prev[selectedRoundId].map((c) =>
        c.id === id ? { ...c, deleted: true } : c,
      ),
    }));
    if (editingId === id) cancelEdit();
    setIsDirty(true);
  };

  const handleSave = () => {
    // TODO: ส่ง API บันทึกการแก้ไขพร้อม audit log
    console.log("save", cards);
    alert("บันทึกการแก้ไขแล้ว (mock)");
    setIsDirty(false);
  };

  if (!eventInfo) {
    return (
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-6xl rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            ไม่พบ Event ID: <span className="font-mono">{eventId}</span>
          </p>
        </div>
      </main>
    );
  }

  if (finishedRounds.length === 0) {
    return (
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">ยังไม่มีรอบที่จบแล้ว</p>
            <p className="mt-1 text-xs text-amber-700">
              สามารถแก้ไขได้เฉพาะรอบที่เสร็จสิ้นแล้วเท่านั้น
            </p>
          </div>
          <Link href={`/admin/events/${eventId}/moderator`}>
            <Button variant="outline" size="sm" className="text-xs">กลับหน้า Moderator</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                แก้ไขข้อมูลของกรรมการ
              </h1>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                ● โหมดแก้ไข
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              ตรวจสอบและแก้ไขใบเตือน / ใบแดงที่กรรมการส่งเข้ามา:{" "}
              <span className="font-medium">{eventInfo.name}</span>
            </p>
            <p className="text-xs text-slate-500">
              {eventInfo.location} • {eventInfo.date}
            </p>
          </div>
          <Link href={`/admin/events/${eventId}/moderator`}>
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับหน้า Moderator
            </Button>
          </Link>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-amber-800">
            การเปลี่ยนแปลงจะถูกบันทึกเป็น audit log ว่า Moderator เป็นผู้แก้ไข —
            แก้ไขได้เฉพาะรอบที่จบแล้วเท่านั้น
          </p>
        </div>

        {/* Round Info */}
        {displayRound && (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{displayRound.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {displayRound.distance_km && <span>ระยะ {displayRound.distance_km} กม.</span>}
                    {displayRound.heat_name && <span>• {displayRound.heat_name}</span>}
                    {displayRound.lapCount && displayRound.currentLap && (
                      <span>• Lap {displayRound.currentLap} / {displayRound.lapCount}</span>
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
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </p>
                  )}
                  {displayRound.expected_end_time && (
                    <p className="text-slate-600">
                      คาดว่าจะจบ:{" "}
                      <span className="font-medium">
                        {new Date(displayRound.expected_end_time).toLocaleString("th-TH", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Judges — same structure as moderator, + edit controls inside expanded */}
        {selectedRoundId && (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">กรรมการในรอบนี้</h2>
                  <p className="text-xs text-slate-500">กดที่ชื่อกรรมการเพื่อดูและแก้ไขใบที่ให้</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {roundJudges.length} คน
                </span>
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
                    {roundJudges.map((judge) => {
                      const isExpanded = expandedJudgeIds.has(judge.id);
                      const { yellowCards, redCards } = getJudgeCards(judge.id);
                      return (
                        <Fragment key={judge.id}>
                          <tr
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? "bg-slate-50 hover:bg-slate-50/70" : "hover:bg-slate-50/70"
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
                              <span className="font-semibold text-slate-900">{judge.name}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{judge.position}</td>

                            {/* ใบเหลือง — dots + progress bar (เหมือน moderator) */}
                            <td className="px-4 py-4">
                              <div className="min-w-[140px] space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-amber-700">Y {yellowCards.length}</span>
                                    {maxY > 0 && <span className="text-[10px] text-slate-400">/ {maxY}</span>}
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

                            {/* ใบแดง — dots + progress bar (เหมือน moderator) */}
                            <td className="px-4 py-4">
                              <div className="min-w-[140px] space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-red-700">R {redCards.length}</span>
                                    {maxR > 0 && <span className="text-[10px] text-slate-400">/ {maxR}</span>}
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

                          {/* Expanded — same layout as moderator, เพิ่มคอลัมน์ "จัดการ" */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="bg-slate-50/60 px-8 py-6">
                                <div className="space-y-7">

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
                                              <th className="px-4 py-3 text-right">จัดการ</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-amber-100 bg-white">
                                            {yellowCards.map((card) => {
                                              const isEditing = editingId === card.id;
                                              const liveSymbol = editDraft.details === "เท้าลอย" ? "~" : ">";
                                              return (
                                                <tr key={card.id} className={isEditing ? "bg-amber-50/60" : "hover:bg-amber-50/40"}>
                                                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                                    {card.targetBib}
                                                  </td>
                                                  <td className="px-4 py-3 text-slate-800">
                                                    {card.targetAthlete}
                                                  </td>
                                                  <td className="px-4 py-3 font-mono text-slate-500">
                                                    {isEditing ? (
                                                      <input
                                                        type="text"
                                                        value={editDraft.time}
                                                        onChange={(e) => setEditDraft((d) => ({ ...d, time: e.target.value }))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-24 rounded border border-sky-300 px-2 py-0.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                                      />
                                                    ) : (
                                                      card.time
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    {isEditing ? (
                                                      <div className="flex items-center gap-2">
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-mono text-[10px] font-bold text-white">
                                                          {liveSymbol}
                                                        </span>
                                                        <select
                                                          value={editDraft.details}
                                                          onChange={(e) => setEditDraft((d) => ({
                                                            ...d,
                                                            details: e.target.value,
                                                            symbol: e.target.value === "เท้าลอย" ? "~" : ">",
                                                          }))}
                                                          onClick={(e) => e.stopPropagation()}
                                                          className="rounded border border-sky-300 px-2 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                                        >
                                                          <option value="เข่างอ">เข่างอ</option>
                                                          <option value="เท้าลอย">เท้าลอย</option>
                                                        </select>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center gap-2">
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-mono text-[10px] font-bold text-white">
                                                          {card.symbol}
                                                        </span>
                                                        <span className="text-slate-700">{card.details}</span>
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    {isEditing ? (
                                                      <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
                                                        >
                                                          ยกเลิก
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); confirmEdit(card.id); }}
                                                          className="rounded-lg border border-sky-500 bg-sky-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-sky-600"
                                                        >
                                                          บันทึก
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); startEdit(card); }}
                                                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
                                                        >
                                                          แก้ไข
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                                                          className="rounded-lg border border-red-200 px-2.5 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                                                        >
                                                          ลบ
                                                        </button>
                                                      </div>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
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
                                              <th className="px-4 py-3 text-right">จัดการ</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-red-100 bg-white">
                                            {redCards.map((card) => {
                                              const isEditing = editingId === card.id;
                                              const liveSymbol = editDraft.details === "เท้าลอย" ? "~" : ">";
                                              return (
                                                <tr key={card.id} className={isEditing ? "bg-red-50/60" : "hover:bg-red-50/40"}>
                                                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                                                    {card.targetBib}
                                                  </td>
                                                  <td className="px-4 py-3 text-slate-800">
                                                    {card.targetAthlete}
                                                  </td>
                                                  <td className="px-4 py-3 font-mono text-slate-500">
                                                    {isEditing ? (
                                                      <input
                                                        type="text"
                                                        value={editDraft.time}
                                                        onChange={(e) => setEditDraft((d) => ({ ...d, time: e.target.value }))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-24 rounded border border-sky-300 px-2 py-0.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                                      />
                                                    ) : (
                                                      card.time
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    {isEditing ? (
                                                      <div className="flex items-center gap-2">
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
                                                          {liveSymbol}
                                                        </span>
                                                        <select
                                                          value={editDraft.details}
                                                          onChange={(e) => setEditDraft((d) => ({
                                                            ...d,
                                                            details: e.target.value,
                                                            symbol: e.target.value === "เท้าลอย" ? "~" : ">",
                                                          }))}
                                                          onClick={(e) => e.stopPropagation()}
                                                          className="rounded border border-sky-300 px-2 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                                        >
                                                          <option value="เข่างอ">เข่างอ</option>
                                                          <option value="เท้าลอย">เท้าลอย</option>
                                                        </select>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center gap-2">
                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
                                                          {card.symbol}
                                                        </span>
                                                        <span className="text-slate-700">{card.details}</span>
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    {isEditing ? (
                                                      <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
                                                        >
                                                          ยกเลิก
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); confirmEdit(card.id); }}
                                                          className="rounded-lg border border-sky-500 bg-sky-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-sky-600"
                                                        >
                                                          บันทึก
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); startEdit(card); }}
                                                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
                                                        >
                                                          แก้ไข
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                                                          className="rounded-lg border border-red-200 px-2.5 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                                                        >
                                                          ลบ
                                                        </button>
                                                      </div>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
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
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save / Cancel */}
        {selectedRoundId && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              {isDirty ? (
                <span className="font-medium text-amber-600">● มีการแก้ไขที่ยังไม่ได้บันทึก</span>
              ) : (
                "ข้อมูลเป็นปัจจุบัน"
              )}
            </p>
            <div className="flex gap-2">
              <Link href={`/admin/events/${eventId}/moderator`}>
                <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
                  ยกเลิก
                </Button>
              </Link>
              <Button
                size="sm"
                disabled={!isDirty}
                onClick={handleSave}
                className="rounded-lg bg-slate-900 text-xs text-white hover:bg-slate-700 disabled:opacity-40"
              >
                บันทึกการแก้ไข
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

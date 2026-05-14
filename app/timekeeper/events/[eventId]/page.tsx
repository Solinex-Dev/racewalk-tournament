"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";

type TimekeeperPageProps = {
  params: Promise<{ eventId: string }>;
};

type AthleteState = {
  bib: string;
  name: string;
  currentLap: number;
  lapCount: number;
  lastSplit: string | null;
  status: "OK" | "DQ" | "DNF";
};

type LapRecord = {
  id: string;
  bib: string;
  name: string;
  lap: number;
  raceTime: string;
};

const MOCK_EVENT: Record<
  string,
  { id: string; name: string; heat_name: string; distance_km: string; lapCount: number }
> = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
    distance_km: "20",
    lapCount: 20,
  },
};

const INITIAL_ATHLETES: AthleteState[] = [
  { bib: "01", name: "Somchai Rakdee",   currentLap: 7, lapCount: 20, lastSplit: null, status: "OK"  },
  { bib: "02", name: "Jane Doe",          currentLap: 6, lapCount: 20, lastSplit: null, status: "OK"  },
  { bib: "03", name: "Chanida Runfast",   currentLap: 6, lapCount: 20, lastSplit: null, status: "OK"  },
  { bib: "04", name: "Luis Garcia",       currentLap: 5, lapCount: 20, lastSplit: null, status: "DQ"  },
  { bib: "05", name: "Mai Tanaka",        currentLap: 6, lapCount: 20, lastSplit: null, status: "OK"  },
  { bib: "06", name: "Peter Schmidt",     currentLap: 5, lapCount: 20, lastSplit: null, status: "OK"  },
  { bib: "07", name: "Anna Kowalski",     currentLap: 4, lapCount: 20, lastSplit: null, status: "OK"  },
];

function formatMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimekeeperPage(props: TimekeeperPageProps) {
  const { eventId } = use(props.params);
  const event = MOCK_EVENT[eventId];

  const [isRunning, setIsRunning] = useState(false);
  const [raceMs, setRaceMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const [athletes, setAthletes] = useState<AthleteState[]>(INITIAL_ATHLETES);
  const [selectedBib, setSelectedBib] = useState<string | null>(null);
  const [flashingBibs, setFlashingBibs] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<LapRecord[]>([]);
  const [lastAction, setLastAction] = useState<LapRecord | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const handleStartStop = () => {
    if (isRunning) {
      clearInterval(intervalRef.current!);
      setIsRunning(false);
    } else {
      startRef.current = Date.now() - raceMs;
      intervalRef.current = setInterval(() => {
        setRaceMs(Date.now() - startRef.current);
      }, 100);
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    clearInterval(intervalRef.current!);
    setIsRunning(false);
    setRaceMs(0);
  };

  const handleSelectRow = (bib: string) => {
    setSelectedBib((prev) => (prev === bib ? null : bib));
  };

  const handleRecordLap = (bib: string) => {
    if (!isRunning) return;

    const raceTime = formatMs(raceMs);
    let newLap = 0;

    setAthletes((prev) =>
      prev.map((a) => {
        if (a.bib !== bib) return a;
        newLap = a.currentLap + 1;
        return { ...a, currentLap: newLap, lastSplit: raceTime };
      }),
    );

    const athlete = athletes.find((a) => a.bib === bib)!;
    newLap = athlete.currentLap + 1;

    const record: LapRecord = {
      id: `${Date.now()}-${bib}`,
      bib,
      name: athlete.name,
      lap: newLap,
      raceTime,
    };

    setLog((prev) => [record, ...prev]);
    setLastAction(record);

    setFlashingBibs((prev) => new Set(prev).add(bib));
    setTimeout(() => {
      setFlashingBibs((prev) => {
        const next = new Set(prev);
        next.delete(bib);
        return next;
      });
    }, 600);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setLastAction(null), 5000);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.bib !== lastAction.bib) return a;
        return { ...a, currentLap: a.currentLap - 1, lastSplit: null };
      }),
    );
    setLog((prev) => prev.filter((r) => r.id !== lastAction.id));
    setLastAction(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const selectedAthlete = athletes.find((a) => a.bib === selectedBib) ?? null;
  const isSelectedDQ = selectedAthlete?.status === "DQ" || selectedAthlete?.status === "DNF";
  const isSelectedComplete = (selectedAthlete?.currentLap ?? 0) >= (selectedAthlete?.lapCount ?? 0);
  const canRecord = isRunning && !isSelectedDQ && !isSelectedComplete;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className={`mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8 ${selectedBib ? "pb-36" : ""}`}
      >
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
              หน้าผู้บันทึกรอบ
            </h1>
            {event ? (
              <>
                <p className="mt-1 text-sm text-slate-300">
                  กิจกรรม:{" "}
                  <span className="font-semibold text-slate-100">{event.name}</span>{" "}
                  – {event.heat_name}
                </p>
                <p className="text-sm text-slate-400">
                  ระยะ {event.distance_km} กม. • {event.lapCount} รอบ
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-red-400">ไม่พบข้อมูล Event</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Race timer */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2">
              <span
                className={`font-mono text-2xl font-bold tracking-tight ${
                  isRunning ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {formatMs(raceMs)}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleStartStop}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    isRunning
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {isRunning ? "หยุด" : "เริ่ม"}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isRunning}
                  className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-600 disabled:opacity-40"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>

            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              เปิดหน้า Live / Public
            </Link>
          </div>
        </header>

        {/* Undo bar */}
        {lastAction && (
          <div className="flex items-center justify-between rounded-xl border border-amber-800 bg-amber-950 px-4 py-2.5">
            <p className="text-xs text-amber-200">
              บันทึก Lap {lastAction.lap} ให้ Bib{" "}
              <span className="font-mono font-bold">{lastAction.bib}</span> ที่{" "}
              <span className="font-mono">{lastAction.raceTime}</span>
            </p>
            <button
              onClick={handleUndo}
              className="ml-4 shrink-0 text-xs font-semibold text-amber-400 underline underline-offset-2"
            >
              ยกเลิก
            </button>
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
          {/* Athlete table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                รายชื่อนักกีฬา
              </p>
              {!isRunning && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  กด <span className="text-emerald-400 font-semibold">เริ่ม</span> จับเวลาก่อน จึงจะบันทึก Lap ได้
                </p>
              )}
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-medium uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm">BIB</th>
                    <th className="px-3 py-2 text-center text-sm">รอบ</th>
                    <th className="px-3 py-2 text-center text-sm">เวลาล่าสุด</th>
                    <th className="px-3 py-2 text-center text-sm">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {athletes.map((athlete) => {
                    const isDQ = athlete.status === "DQ" || athlete.status === "DNF";
                    const isComplete = athlete.currentLap >= athlete.lapCount;
                    const isFlashing = flashingBibs.has(athlete.bib);
                    const isSelected = selectedBib === athlete.bib;

                    return (
                      <tr
                        key={athlete.bib}
                        onClick={() => handleSelectRow(athlete.bib)}
                        className={`cursor-pointer transition-colors ${
                          isFlashing
                            ? "bg-emerald-900/40"
                            : isSelected
                            ? "bg-slate-700/60 ring-1 ring-inset ring-slate-500"
                            : isDQ
                            ? "bg-slate-800/30 opacity-60 hover:bg-slate-800/50"
                            : "hover:bg-slate-800/50"
                        }`}
                      >
                        <td
                          className={`px-3 py-3 font-mono text-base font-bold ${
                            isDQ ? "text-slate-500" : "text-amber-400"
                          }`}
                        >
                          {athlete.bib}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-mono text-sm font-semibold ${
                              isFlashing
                                ? "text-emerald-400"
                                : isComplete
                                ? "text-emerald-400"
                                : isDQ
                                ? "text-slate-500"
                                : "text-slate-100"
                            }`}
                          >
                            {athlete.currentLap}
                            <span className="text-xs font-normal text-slate-500">
                              /{athlete.lapCount}
                            </span>
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-mono text-xs text-slate-400">
                            {athlete.lastSplit ?? "—"}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                              athlete.status === "DQ"
                                ? "bg-red-950 text-red-400 ring-red-800"
                                : athlete.status === "DNF"
                                ? "bg-amber-950 text-amber-400 ring-amber-800"
                                : isComplete
                                ? "bg-emerald-950 text-emerald-400 ring-emerald-800"
                                : "bg-slate-800 text-slate-300 ring-slate-700"
                            }`}
                          >
                            {isComplete && athlete.status === "OK"
                              ? "เสร็จสิ้น"
                              : athlete.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lap log */}
          <aside className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                บันทึก Lap ล่าสุด
              </p>
            </div>

            {log.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-slate-500">ยังไม่มีการบันทึก</p>
                <p className="mt-1 text-[10px] text-slate-600">
                  เลือกนักกีฬาแล้วกด "บันทึก Lap"
                </p>
              </div>
            ) : (
              <ul className="max-h-[290px] divide-y divide-slate-800 overflow-y-auto">
                {log.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-mono text-base font-bold text-amber-400">
                        {record.bib}
                      </span>
                      <div>
                        <p className="text-xs text-slate-200">{record.name}</p>
                        <p className="text-[10px] text-slate-500">Lap {record.lap}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-emerald-400">
                      {record.raceTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </section>
      </div>

      {/* Sticky action bar */}
      {selectedAthlete && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-3">
            {/* Info row */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-amber-400">
                  BIB {selectedAthlete.bib}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                    isSelectedDQ
                      ? "bg-red-950 text-red-400 ring-red-800"
                      : isSelectedComplete
                      ? "bg-emerald-950 text-emerald-400 ring-emerald-800"
                      : "bg-slate-800 text-slate-300 ring-slate-700"
                  }`}
                >
                  {isSelectedDQ
                    ? selectedAthlete.status
                    : isSelectedComplete
                    ? "เสร็จสิ้น"
                    : `รอบ ${selectedAthlete.currentLap}/${selectedAthlete.lapCount}`}
                </span>
              </div>
              <button
                onClick={() => setSelectedBib(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Record button */}
            <button
              onClick={() => handleRecordLap(selectedAthlete.bib)}
              disabled={!canRecord}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-colors ${
                !canRecord
                  ? "cursor-not-allowed bg-slate-800 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
              }`}
            >
              {!isRunning
                ? "กด เริ่ม จับเวลาก่อน"
                : isSelectedDQ
                ? `นักกีฬาสถานะ ${selectedAthlete.status}`
                : isSelectedComplete
                ? "ครบทุกรอบแล้ว"
                : `บันทึก Lap ${selectedAthlete.currentLap + 1}`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

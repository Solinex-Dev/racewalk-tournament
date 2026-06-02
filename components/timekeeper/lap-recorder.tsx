"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordLapTime, recordFinishTime } from "@/app/actions/timing";
import { logoutOfficial } from "@/app/actions/officials";

export type AthleteRecord = {
  bib: string;
  athleteId: string;
  name: string;
  currentLap: number;
  lapCount: number;
  lastLapAt: string | null;
  status: "OK" | "DQ" | "DNF";
  finishedAt: string | null;
};

type LapRecorderProps = {
  eventId: string;
  judgeName: string;
  roleLabel: string;
  joinPath: string;
  eventName: string;
  roundName: string;
  distanceKm: string;
  lapCount: number;
  athletes: AthleteRecord[];
  /** ISO string — set by admin when race begins (synced across all roles) */
  raceStartedAt: string | null;
  raceEndedAt: string | null;
};

function formatMs(ms: number) {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LapRecorder({
  eventId,
  judgeName,
  roleLabel,
  joinPath,
  eventName,
  roundName,
  distanceKm,
  lapCount,
  athletes,
  raceStartedAt,
  raceEndedAt,
}: LapRecorderProps) {
  const router = useRouter();
  const startMs = raceStartedAt ? new Date(raceStartedAt).getTime() : null;
  const endMs = raceEndedAt ? new Date(raceEndedAt).getTime() : null;

  const [now, setNow] = React.useState(() => Date.now());
  const [actingBib, setActingBib] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Tick every 250ms while race is live
  React.useEffect(() => {
    if (!startMs || endMs) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  const isRunning = !!startMs && !endMs;
  const elapsedMs = startMs ? (endMs ?? now) - startMs : 0;

  const handleRecordLap = (athlete: AthleteRecord) => {
    if (!isRunning) {
      toast.error("รอ Admin เริ่มจับเวลาก่อน");
      return;
    }
    if (athlete.status !== "OK" || athlete.finishedAt) return;

    setActingBib(athlete.bib);
    const nextLap = athlete.currentLap + 1;
    const captureMs = elapsedMs;

    startTransition(async () => {
      try {
        if (nextLap >= athlete.lapCount) {
          const res = await recordFinishTime(athlete.athleteId, captureMs);
          toast.success(`บันทึกเข้าเส้นชัย BIB ${athlete.bib} — ${formatMs(captureMs)}`);
          if (res?.roundEnded) {
            toast.success("นักกีฬาเข้าเส้นชัยครบทุกคน — จบการแข่งขันอัตโนมัติ");
          }
        } else {
          await recordLapTime(athlete.athleteId, nextLap, captureMs);
          toast.success(`บันทึก Lap ${nextLap} ของ BIB ${athlete.bib}`);
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setActingBib(null);
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutOfficial();
      router.push(joinPath);
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
              {roleLabel}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              กิจกรรม: <span className="font-semibold text-slate-100">{eventName}</span> – {roundName}
            </p>
            <p className="text-sm text-slate-400">
              ระยะ {distanceKm} กม. • {lapCount} รอบ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2">
              <span
                className={`font-mono text-2xl font-bold tracking-tight ${
                  isRunning ? "text-emerald-400" : endMs ? "text-slate-400" : "text-amber-400"
                }`}
              >
                {formatMs(elapsedMs)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {isRunning ? "● Live" : endMs ? "Ended" : "Waiting"}
              </span>
            </div>

            <div className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200">
              <span className="text-slate-400">{roleLabel}: </span>
              <span className="font-medium text-slate-100">{judgeName}</span>
            </div>
            <Link
              href={`/events/${eventId}`}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              เปิดหน้า Live
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {!isRunning && !endMs && (
          <div className="rounded-lg border border-amber-800 bg-amber-900/20 px-4 py-2 text-sm text-amber-200">
            ⏳ รอ Admin เริ่มจับเวลาในหน้า Moderator — เมื่อเริ่มแล้วเวลาด้านบนจะเริ่มเดิน
          </div>
        )}
        {endMs && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">
            ✅ การแข่งขันจบลงแล้ว ไม่สามารถบันทึก Lap เพิ่มได้
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
              รายชื่อนักกีฬา ({athletes.length} คน) – กดที่ปุ่ม &quot;Lap&quot; เพื่อบันทึก
            </p>
          </div>

          <div className="max-h-[600px] overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-medium uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">BIB</th>
                  {/* <th className="px-3 py-2 text-left">นักกีฬา</th> */}
                  <th className="px-3 py-2 text-center">รอบ</th>
                  <th className="px-3 py-2 text-center">Lap ล่าสุด</th>
                  <th className="px-3 py-2 text-center">สถานะ</th>
                  <th className="px-3 py-2 text-right">บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {athletes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      ไม่มีนักกีฬาในรอบนี้
                    </td>
                  </tr>
                ) : (
                  athletes.map((a) => {
                    const isDQ = a.status === "DQ" || a.status === "DNF";
                    const isFinished = !!a.finishedAt;
                    const canRecord = isRunning && !isDQ && !isFinished;
                    const isActing = actingBib === a.bib && isPending;
                    return (
                      <tr
                        key={a.bib}
                        className={`transition-colors ${
                          isDQ ? "opacity-60" : "hover:bg-slate-800/50"
                        }`}
                      >
                        <td className={`px-3 py-3 font-mono text-base font-bold ${isDQ ? "text-slate-500" : "text-amber-400"}`}>
                          {a.bib}
                        </td>
                        {/* <td className="px-3 py-3 text-slate-100">{a.name}</td> */}
                        <td className="px-3 py-3 text-center font-mono text-sm">
                          {a.currentLap}<span className="text-xs text-slate-500">/{a.lapCount}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-xs text-slate-400">
                          {a.lastLapAt ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                              a.status === "DQ"
                                ? "bg-red-950 text-red-400 ring-red-800"
                                : a.status === "DNF"
                                  ? "bg-amber-950 text-amber-400 ring-amber-800"
                                  : isFinished
                                    ? "bg-emerald-950 text-emerald-400 ring-emerald-800"
                                    : "bg-slate-800 text-slate-300 ring-slate-700"
                            }`}
                          >
                            {a.status === "OK" && isFinished ? "เสร็จสิ้น" : a.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            disabled={!canRecord || isActing}
                            onClick={() => handleRecordLap(a)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              !canRecord || isActing
                                ? "cursor-not-allowed bg-slate-800 text-slate-500"
                                : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            {isActing
                              ? "กำลังบันทึก..."
                              : isFinished
                                ? "เสร็จสิ้น"
                                : a.currentLap + 1 >= a.lapCount
                                  ? "เข้าเส้นชัย"
                                  : `Lap ${a.currentLap + 1}`}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

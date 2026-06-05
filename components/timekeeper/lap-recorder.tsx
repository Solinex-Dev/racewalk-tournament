"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordLapTime, recordFinishTime } from "@/app/actions/timing";
import { logoutOfficial } from "@/app/actions/officials";
import { RaceStatusBanner } from "@/components/common/race-status-banner";
import { metersFromKm } from "@/lib/distance";

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

// After a tap, lock that athlete's button for this long to prevent rapid re-taps.
const COOLDOWN_MS = 10_000;
// Cooldown ring geometry (SVG viewBox 0 0 36 36, r = 15.5).
const RING_R = 15.5;
const RING_C = 2 * Math.PI * RING_R;

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
}: Readonly<LapRecorderProps>) {
  const router = useRouter();
  const startMs = raceStartedAt ? new Date(raceStartedAt).getTime() : null;
  const endMs = raceEndedAt ? new Date(raceEndedAt).getTime() : null;

  const [now, setNow] = React.useState(() => Date.now());
  const [actingId, setActingId] = React.useState<string | null>(null);
  // athleteId → timestamp (ms) when its 10s cooldown ends.
  const [cooldowns, setCooldowns] = React.useState<Record<string, number>>({});
  const [isPending, startTransition] = React.useTransition();

  // Tick every 250ms while race is live
  React.useEffect(() => {
    if (!startMs || endMs) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  const isRunning = !!startMs && !endMs;
  const elapsedMs = startMs ? (endMs ?? now) - startMs : 0;

  const timerIdleColor = endMs ? "text-slate-400" : "text-amber-400";
  const timerColorClass = isRunning ? "text-emerald-400" : timerIdleColor;
  const timerIdleLabel = endMs ? "Ended" : "Waiting";
  const timerStatusLabel = isRunning ? "● Live" : timerIdleLabel;

  // Keep the acting row disabled for the WHOLE transition — including the
  // router.refresh() round-trip — so its button can't re-enable with a stale lap
  // number and double-fire. Other athletes stay independently tappable for fast
  // multi-athlete logging. (The server actions are also idempotent as a backstop.)
  React.useEffect(() => {
    if (!isPending) setActingId(null);
  }, [isPending]);

  // `seq` is the athlete's 1-based start-list number (shown on the button), used
  // in toasts so the message matches what the official sees on screen.
  const handleRecordLap = (athlete: AthleteRecord, seq: number) => {
    if (isPending && actingId === athlete.athleteId) return;
    if ((cooldowns[athlete.athleteId] ?? 0) > Date.now()) return; // still cooling down
    if (!isRunning) {
      toast.error("รอ Admin เริ่มจับเวลาก่อน");
      return;
    }
    if (athlete.status !== "OK" || athlete.finishedAt) return;

    setActingId(athlete.athleteId);
    // Start the 10s cooldown immediately for instant feedback; cleared on error.
    setCooldowns((c) => ({ ...c, [athlete.athleteId]: Date.now() + COOLDOWN_MS }));
    const nextLap = athlete.currentLap + 1;
    const captureMs = elapsedMs;

    startTransition(async () => {
      try {
        if (nextLap >= athlete.lapCount) {
          const res = await recordFinishTime(athlete.athleteId, captureMs);
          if (res?.alreadyFinished) {
            toast.info(`ลำดับ ${seq} (${athlete.name}) เข้าเส้นชัยอยู่แล้ว`);
          } else {
            toast.success(`เข้าเส้นชัย — ลำดับ ${seq} (${athlete.name}) ${formatMs(captureMs)}`);
            if (res?.roundEnded) {
              toast.success("นักกีฬาเข้าเส้นชัยครบทุกคน — จบการแข่งขันอัตโนมัติ");
            }
          }
        } else {
          const res = await recordLapTime(athlete.athleteId, nextLap, captureMs);
          if (res?.duplicate) {
            toast.info(`Lap ${nextLap} ของลำดับ ${seq} บันทึกอยู่แล้ว`);
          } else {
            toast.success(`บันทึก Lap ${nextLap} — ลำดับ ${seq} (${athlete.name})`);
          }
        }
        router.refresh();
      } catch (err) {
        // Failed — release the cooldown so the official can retry immediately.
        setCooldowns((c) => {
          const next = { ...c };
          delete next[athlete.athleteId];
          return next;
        });
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
              ระยะ {metersFromKm(distanceKm)} ม. • {lapCount} รอบ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2">
              <span
                className={`font-mono text-2xl font-bold tracking-tight ${timerColorClass}`}
              >
                {formatMs(elapsedMs)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {timerStatusLabel}
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
              ดูกระดานคะแนน
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

        <RaceStatusBanner
          phase={endMs ? "ended" : isRunning ? "live" : "not-started"}
          action="บันทึก Lap"
        />

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-sm sm:p-4">
          <p className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">
            นักกีฬา ({athletes.length} คน)
          </p>

          {athletes.length === 0 ? (
            <p className="px-3 py-8 text-center text-slate-500">ไม่มีนักกีฬาในรอบนี้</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {athletes.map((a, i) => {
                const seq = i + 1;
                const isDQ = a.status === "DQ";
                const isDNF = a.status === "DNF";
                const isOut = isDQ || isDNF;
                const isFinished = !!a.finishedAt;
                const isActing = actingId === a.athleteId && isPending;
                const cooldownLeftMs = Math.max(0, (cooldowns[a.athleteId] ?? 0) - now);
                const onCooldown = cooldownLeftMs > 0 && !isOut && !isFinished;
                const canTap = isRunning && !isOut && !isFinished && !isActing && !onCooldown;

                // Status is conveyed by colour alone (no text labels): red = DQ,
                // amber = DNF, emerald = finished, slate = tappable, dim = locked.
                let stateClass: string;
                if (isDQ) stateClass = "border-red-800 bg-red-950/60 text-red-400";
                else if (isDNF) stateClass = "border-amber-800 bg-amber-950/60 text-amber-400";
                else if (isFinished) stateClass = "border-emerald-700 bg-emerald-950/70 text-emerald-300";
                else if (isActing) stateClass = "border-emerald-400 bg-emerald-700 text-white animate-pulse";
                else if (onCooldown) stateClass = "border-slate-700 bg-slate-800 text-slate-100";
                else if (canTap)
                  stateClass =
                    "border-slate-600 bg-slate-800 text-slate-100 hover:border-emerald-500 hover:bg-slate-700 active:scale-[0.97]";
                else stateClass = "border-slate-700 bg-slate-800/60 text-slate-400";

                return (
                  <button
                    key={a.athleteId}
                    type="button"
                    disabled={!canTap}
                    onClick={() => handleRecordLap(a, seq)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-1 transition-all disabled:cursor-not-allowed ${stateClass}`}
                  >
                    <span className="absolute right-1.5 top-1.5 font-mono text-[11px] text-slate-400">
                      {a.currentLap}/{a.lapCount}
                    </span>
                    <span className="text-4xl font-extrabold leading-none sm:text-5xl">{seq}</span>

                    {/* Cooldown overlay — dims the whole card with a countdown ring */}
                    {onCooldown && (
                      <span className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/90">
                        <span className="relative flex items-center justify-center">
                          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r={RING_R} fill="none" strokeWidth="3.5" className="stroke-slate-700" />
                            <circle
                              cx="18"
                              cy="18"
                              r={RING_R}
                              fill="none"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              className="stroke-slate-400 transition-[stroke-dashoffset] duration-200 ease-linear"
                              strokeDasharray={RING_C}
                              strokeDashoffset={RING_C * (1 - cooldownLeftMs / COOLDOWN_MS)}
                            />
                          </svg>
                          <span className="absolute font-mono text-lg font-bold text-white">
                            {Math.ceil(cooldownLeftMs / 1000)}
                          </span>
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

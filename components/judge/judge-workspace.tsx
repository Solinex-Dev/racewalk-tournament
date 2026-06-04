"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { issueYellowCard, issueRedCard, type CardSymbol } from "@/app/actions/cards";
import { logoutOfficial } from "@/app/actions/officials";
import { RaceStatusBanner, racePhaseFromStatus } from "@/components/common/race-status-banner";

export type JudgeAthleteRow = {
  bib: string;
  athleteId: string;
  name: string;
  status: "OK" | "DQ" | "DNF";
  isFinished: boolean;
  myYellowKnee: boolean;
  myYellowFoot: boolean;
  myRedSymbol: "~" | ">" | null;
  totalRed: number;
};

export type JudgeEventInfo = {
  id: string;
  name: string;
  roundName: string;
  distanceKm: string;
  lapCount: number;
  currentLap: number;
};

type JudgeWorkspaceProps = {
  eventId: string;
  event: JudgeEventInfo | null;
  judgeName: string;
  roundStatus: string;
  athletes: JudgeAthleteRow[];
};

export function JudgeWorkspace({ eventId, event, judgeName, roundStatus, athletes }: Readonly<JudgeWorkspaceProps>) {
  const router = useRouter();
  const [selectedBib, setSelectedBib] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const selectedAthlete = athletes.find((r) => r.bib === selectedBib) ?? null;

  const handleSelectRow = (bib: string) => {
    setSelectedBib((prev) => (prev === bib ? null : bib));
  };

  const handleYellow = (athleteId: string, symbol: CardSymbol) => {
    startTransition(async () => {
      try {
        await issueYellowCard(athleteId, symbol);
        toast.success(`ออกใบเหลือง (${symbol === "BENT_KNEE" ? "งอเข่า" : "ยกเท้า"})`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleRed = (athleteId: string, symbol: CardSymbol) => {
    startTransition(async () => {
      try {
        await issueRedCard(athleteId, symbol);
        toast.success(`ออกใบแดง (${symbol === "BENT_KNEE" ? "งอเข่า" : "ยกเท้า"}) — รอ Head Judge ยืนยัน`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutOfficial();
      router.push(`/judge/events/${eventId}/join`);
    });
  };

  const isDQSelected = selectedAthlete?.status === "DQ";
  const isFinishedSelected = !!selectedAthlete?.isFinished;
  // Cards can't be issued to an athlete who is DQ'd or has crossed the line.
  const isLockedSelected = isDQSelected || isFinishedSelected;
  const hasGivenSelected = !!selectedAthlete?.myRedSymbol;
  // Cards may only be issued while the round is actually in progress — before the
  // moderator starts the race (or after it ends) the controls are locked so a
  // judge can't trigger a server-side "round not started" error.
  const isRoundLive = roundStatus === "ONGOING";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className={`mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8 ${selectedBib ? "pb-36" : ""}`}
      >
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
              หน้ากรรมการ
            </h1>
            {event ? (
              <>
                <p className="mt-1 text-sm text-slate-300">
                  กิจกรรม:{" "}
                  <span className="font-semibold text-slate-100">{event.name}</span>{" "}
                  – {event.roundName}
                </p>
                <p className="text-sm text-slate-400">
                  ระยะ {event.distanceKm} กม. • Lap {event.currentLap} / {event.lapCount}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-red-400">ไม่พบข้อมูล Event/Round</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200">
              <span className="text-slate-400">กรรมการ: </span>
              <span className="font-medium text-slate-100">{judgeName}</span>
            </div>
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              เปิดหน้า Live
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        <RaceStatusBanner phase={racePhaseFromStatus(roundStatus)} action="ออกใบ" />

        <section className="grid gap-4 lg:grid-cols-[2fr,1.1fr] overflow-hidden">
          <div className="space-y-4 w-full overflow-hidden">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
              <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  รายชื่อนักกีฬา
                </p>
              </div>

              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-medium uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm">BIB</th>
                      <th className="px-3 py-2 text-left text-sm">สถานะ</th>
                      <th className="px-3 py-2 text-left text-sm text-amber-400">ใบเหลือง (ของคุณ)</th>
                      <th className="px-3 py-2 text-left text-sm text-red-400">ใบแดง (ของคุณ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {athletes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                          ไม่มีนักกีฬาในรอบนี้
                        </td>
                      </tr>
                    ) : (
                      athletes.map((athlete) => {
                        const isDQ = athlete.status === "DQ";
                        const isFinished = athlete.isFinished;
                        const isSelected = selectedBib === athlete.bib;
                        let unselectedRowClass: string;
                        if (isDQ) {
                          unselectedRowClass = "bg-slate-800/30 opacity-60 hover:bg-slate-800/50";
                        } else if (isFinished) {
                          unselectedRowClass = "bg-slate-800/20 opacity-70 hover:bg-slate-800/40";
                        } else {
                          unselectedRowClass = "hover:bg-slate-800/50";
                        }
                        return (
                          <tr
                            key={athlete.bib}
                            onClick={() => handleSelectRow(athlete.bib)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-slate-700/60 ring-1 ring-inset ring-slate-500"
                                : unselectedRowClass
                            }`}
                          >
                            <td className={`px-3 py-2 font-mono text-base font-bold ${isDQ ? "text-slate-500" : "text-amber-400"}`}>
                              {athlete.bib}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ${
                                  isDQ
                                    ? "bg-red-950 text-red-400 ring-red-800"
                                    : isFinished
                                      ? "bg-sky-950 text-sky-300 ring-sky-800"
                                      : "bg-emerald-950 text-emerald-400 ring-emerald-800"
                                }`}
                              >
                                {isFinished && !isDQ ? "เข้าเส้นชัย" : athlete.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <span
                                  title="งอเข่า"
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                                    athlete.myYellowKnee
                                      ? "bg-amber-400 text-slate-900"
                                      : "ring-2 ring-amber-900 text-amber-900"
                                  }`}
                                >
                                  &gt;
                                </span>
                                <span
                                  title="ยกเท้า"
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                                    athlete.myYellowFoot
                                      ? "bg-amber-400 text-slate-900"
                                      : "ring-2 ring-amber-900 text-amber-900"
                                  }`}
                                >
                                  ~
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold text-white ${
                                  athlete.myRedSymbol ? "bg-red-500 ring-2 ring-yellow-400" : "ring-2 ring-red-900"
                                }`}
                              >
                                {athlete.myRedSymbol ?? ""}
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
          </div>
        </section>
      </div>

      {/* Sticky action bar */}
      {selectedAthlete && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-amber-400">
                  BIB {selectedAthlete.bib}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                    isDQSelected
                      ? "bg-red-950 text-red-400 ring-red-800"
                      : isFinishedSelected
                        ? "bg-sky-950 text-sky-300 ring-sky-800"
                        : "bg-emerald-950 text-emerald-400 ring-emerald-800"
                  }`}
                >
                  {isFinishedSelected && !isDQSelected ? "เข้าเส้นชัย" : selectedAthlete.status}
                </span>
                {selectedAthlete.name && (
                  <span className="text-sm text-slate-400">{selectedAthlete.name}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBib(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {(isLockedSelected || !isRoundLive) && (
              <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-center text-xs font-medium text-slate-300">
                {!isRoundLive
                  ? roundStatus === "FINISHED"
                    ? "การแข่งขันจบแล้ว — ออกใบไม่ได้"
                    : "ยังไม่เริ่มการแข่งขัน — ออกใบไม่ได้"
                  : isDQSelected
                    ? "นักกีฬาถูกตัดสิทธิ์ (DQ) — ออกใบไม่ได้"
                    : "นักกีฬาเข้าเส้นชัยแล้ว — ออกใบไม่ได้"}
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-center text-base font-medium text-amber-400/70">ใบเหลือง</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending || !isRoundLive || isLockedSelected || selectedAthlete.myYellowKnee}
                    onClick={() => handleYellow(selectedAthlete.athleteId, "BENT_KNEE")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isPending || !isRoundLive || isLockedSelected || selectedAthlete.myYellowKnee
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-amber-700 bg-amber-950 text-amber-400 active:bg-amber-800"
                    }`}
                  >
                    <span className="text-base">&gt;</span>
                    <span>งอเข่า</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !isRoundLive || isLockedSelected || selectedAthlete.myYellowFoot}
                    onClick={() => handleYellow(selectedAthlete.athleteId, "LIFTED_FOOT")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isPending || !isRoundLive || isLockedSelected || selectedAthlete.myYellowFoot
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-amber-700 bg-amber-950 text-amber-400 active:bg-amber-800"
                    }`}
                  >
                    <span className="text-base">~</span>
                    <span>ยกเท้า</span>
                  </button>
                </div>
              </div>

              <div className="w-px self-stretch bg-slate-700" />

              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-center text-base font-medium text-red-400/70">ใบแดง</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending || !isRoundLive || isLockedSelected || hasGivenSelected}
                    onClick={() => handleRed(selectedAthlete.athleteId, "BENT_KNEE")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isPending || !isRoundLive || isLockedSelected || hasGivenSelected
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-red-700 bg-red-950 text-red-400 active:bg-red-800"
                    }`}
                  >
                    <span className="text-base">&gt;</span>
                    <span>งอเข่า</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !isRoundLive || isLockedSelected || hasGivenSelected}
                    onClick={() => handleRed(selectedAthlete.athleteId, "LIFTED_FOOT")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isPending || !isRoundLive || isLockedSelected || hasGivenSelected
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-red-700 bg-red-950 text-red-400 active:bg-red-800"
                    }`}
                  >
                    <span className="text-base">~</span>
                    <span>ยกเท้า</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

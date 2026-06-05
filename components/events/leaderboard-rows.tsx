"use client";

import { motion, useReducedMotion } from "framer-motion";
import { JudgeCardMatrix, type RedCardDetail } from "@/components/judge/card-matrix";

export type LeaderboardAthlete = {
  bib: string;
  athleteId: string;
  name: string;
  affiliation: string;
  yellowCards: number;
  redCards: number;
  redCardDetails: RedCardDetail[];
  rank: number | null;
  status: "OK" | "DQ" | "DNF";
  currentLap: number;
  isFinished: boolean;
};

// Shared grid so the header and every row line their columns up. Mobile shows
// 4 columns; the red-card + status columns appear from md up (their cells are
// `hidden md:*`, so they drop out of the 4-col mobile grid cleanly).
const COLS_WITH_RANK =
  "grid items-center gap-3 px-5 grid-cols-[2.75rem_3.5rem_3rem_1fr] md:grid-cols-[4rem_5rem_4rem_1fr_auto_7rem]";
const COLS_NO_RANK =
  "grid items-center gap-3 px-5 grid-cols-[3.5rem_3rem_1fr] md:grid-cols-[5rem_4rem_1fr_auto_7rem]";

function medalClass(rank: number): string {
  if (rank === 1) return "bg-amber-400/20 text-amber-300 ring-amber-500/40";
  if (rank === 2) return "bg-slate-300/20 text-slate-200 ring-slate-400/40";
  if (rank === 3) return "bg-orange-700/30 text-orange-300 ring-orange-600/40";
  return "bg-slate-700/40 text-slate-200 ring-slate-600/40";
}

function statusBadge(status: LeaderboardAthlete["status"], isFinished: boolean) {
  if (status === "DQ") return { cls: "bg-red-950 text-red-400 ring-red-800", label: "DQ" };
  if (status === "DNF") return { cls: "bg-amber-950 text-amber-400 ring-amber-800", label: "DNF" };
  if (isFinished) return { cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-600/40", label: "FINISHED" };
  return { cls: "bg-sky-950 text-sky-300 ring-sky-800", label: "OK" };
}

export function LeaderboardRows({
  athletes,
  lapCount,
  showRank = false,
}: Readonly<{ athletes: LeaderboardAthlete[]; lapCount: number; showRank?: boolean }>) {
  const reduced = useReducedMotion();
  const COLS = showRank ? COLS_WITH_RANK : COLS_NO_RANK;

  if (athletes.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-slate-500">
        ยังไม่มีข้อมูลการแข่งขันในรอบนี้
      </div>
    );
  }

  return (
    <div>
      <div
        className={`${COLS} sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 py-4 text-[14px] font-medium uppercase text-slate-400 backdrop-blur`}
      >
        {showRank && <div className="text-center">อันดับ</div>}
        <div className="text-center">รอบ</div>
        <div className="text-center">BIB</div>
        <div>นักกีฬา</div>
        <div className="hidden text-center md:block">ใบแดง</div>
        <div className="hidden text-center md:block">สถานะ</div>
      </div>

      <div>
        {athletes.map((a) => {
          const isDQ = a.status === "DQ";
          const isFinished = a.isFinished && a.status === "OK";
          const rowBg = isDQ
            ? "bg-slate-800/30 opacity-60"
            : isFinished
              ? "bg-emerald-950/30"
              : "";
          const badge = statusBadge(a.status, isFinished);
          return (
            <motion.div
              key={a.athleteId}
              layout={!reduced}
              transition={
                reduced ? { duration: 0 } : { type: "spring", stiffness: 550, damping: 42 }
              }
              className={`${COLS} border-b border-slate-800 py-4 ${rowBg}`}
            >
              {showRank && (
                <div className="flex justify-center">
                  {a.rank !== null ? (
                    <span
                      className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-sm font-bold ring-1 ${medalClass(a.rank)}`}
                      title="อันดับ (คำนวณสด ปรับตามผู้ถูกตัดสิทธิ์แล้ว)"
                    >
                      {a.rank}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </div>
              )}

              <div className="text-center">
                <span
                  className={`font-mono text-sm font-semibold ${isDQ ? "text-slate-500" : "text-slate-100"}`}
                >
                  {a.currentLap}
                  <span
                    className={`text-xs font-normal ${isDQ ? "text-slate-600" : "text-slate-400"}`}
                  >
                    /{lapCount || "?"}
                  </span>
                </span>
              </div>

              <div
                className={`text-center font-mono text-lg ${isDQ ? "text-slate-500" : "text-amber-400"}`}
              >
                {a.bib}
              </div>

              <div className="min-w-0">
                <p className={`truncate text-sm font-bold ${isDQ ? "text-slate-500" : "text-slate-100"}`}>
                  {a.name}
                </p>
                {a.affiliation && (
                  <p className="truncate text-[12px] text-slate-400">{a.affiliation}</p>
                )}
                <div className="mt-1 md:hidden">
                  <JudgeCardMatrix
                    yellow={a.yellowCards}
                    red={a.redCards}
                    redDetails={a.redCardDetails}
                    hideYellow={true}
                    maxRed={4}
                    horizontal={true}
                    mobile={true}
                  />
                </div>
              </div>

              <div className="hidden items-center justify-center md:flex">
                <JudgeCardMatrix
                  yellow={a.yellowCards}
                  red={a.redCards}
                  redDetails={a.redCardDetails}
                  hideYellow={true}
                  maxRed={4}
                  horizontal={true}
                />
              </div>

              <div className="hidden justify-center md:flex">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

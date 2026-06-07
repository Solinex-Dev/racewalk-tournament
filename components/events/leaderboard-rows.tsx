"use client";

import { useEffect, useRef, useState } from "react";
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

// Shared grid so the header and every row line their columns up. Below 992px the
// core (single-column scroll) layout shows; from 992px up the desktop 2-column
// board kicks in and the red-card column appears (its cell is hidden < 992px).
const COLS_WITH_RANK =
  "grid items-center gap-3 px-5 grid-cols-[2.75rem_3.5rem_3rem_1fr] min-[992px]:grid-cols-[4rem_5rem_4rem_1fr_auto]";
const COLS_NO_RANK =
  "grid items-center gap-3 px-5 grid-cols-[3.5rem_3rem_1fr] min-[992px]:grid-cols-[5rem_4rem_1fr_auto]";

// Desktop: two tables of 10 = 20 athletes per page; auto-advance every 10s.
const COLUMN_SIZE = 10;
const PAGE_SIZE = COLUMN_SIZE * 2;
const AUTOPLAY_MS = 10_000;

function medalClass(rank: number): string {
  if (rank === 1) return "bg-amber-400/20 text-amber-300 ring-amber-500/40";
  if (rank === 2) return "bg-slate-300/20 text-slate-200 ring-slate-400/40";
  if (rank === 3) return "bg-orange-700/30 text-orange-300 ring-orange-600/40";
  return "bg-slate-700/40 text-slate-200 ring-slate-600/40";
}

function HeaderRow({ showRank, sticky }: Readonly<{ showRank: boolean; sticky?: boolean }>) {
  const COLS = showRank ? COLS_WITH_RANK : COLS_NO_RANK;
  return (
    <div
      className={`${COLS} ${sticky ? "sticky top-0 z-10" : ""} border-b border-slate-800 bg-slate-900/95 py-4 text-[14px] font-medium uppercase text-slate-400 backdrop-blur`}
    >
      {showRank && <div className="text-center">อันดับ</div>}
      <div className="text-center">รอบ</div>
      <div className="text-center">BIB</div>
      <div>นักกีฬา</div>
      <div className="hidden text-center min-[992px]:block">ใบแดง</div>
      {/* <div className="hidden text-center min-[992px]:block">สถานะ</div> */}
    </div>
  );
}

function LeaderboardRow({
  a,
  lapCount,
  showRank,
}: Readonly<{ a: LeaderboardAthlete; lapCount: number; showRank: boolean }>) {
  const COLS = showRank ? COLS_WITH_RANK : COLS_NO_RANK;
  const isDQ = a.status === "DQ";
  const isFinished = a.isFinished && a.status === "OK";
  const rowBg = isDQ ? "bg-slate-800/30 opacity-60" : isFinished ? "bg-emerald-950/30" : "";
  return (
    <div className={`${COLS} border-b border-slate-800 py-4 min-[992px]:py-1 min-[992px]:overflow-hidden ${rowBg}`}>
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
        <span className={`font-mono text-sm font-semibold ${isDQ ? "text-slate-500" : "text-slate-100"}`}>
          {a.currentLap}
          <span className={`text-xs font-normal ${isDQ ? "text-slate-600" : "text-slate-400"}`}>
            /{lapCount || "?"}
          </span>
        </span>
      </div>

      <div className={`text-center font-mono text-lg ${isDQ ? "text-slate-500" : "text-amber-400"}`}>
        {a.bib}
      </div>

      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${isDQ ? "text-slate-500" : "text-slate-100"}`}>
          {a.name}
        </p>
        {a.affiliation && <p className="truncate text-[12px] text-slate-400">{a.affiliation}</p>}
        <div className="mt-1 min-[992px]:hidden">
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

      <div className="hidden items-center justify-center min-[992px]:flex">
        <JudgeCardMatrix
          yellow={a.yellowCards}
          red={a.redCards}
          redDetails={a.redCardDetails}
          hideYellow={true}
          maxRed={4}
          horizontal={true}
        />
      </div>

      {/* <div className="hidden justify-center min-[992px]:flex">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${badge.cls}`}>
          {badge.label}
        </span>
      </div> */}
    </div>
  );
}

/**
 * One desktop table that fills its column height. The body is a grid of `fillTo`
 * equal-height tracks, so every row is the same height regardless of content, and
 * empty slots are padded with blank rows — the table always shows `fillTo` rows
 * and stretches to fill the screen (no inner scroll).
 */
function ColumnTable({
  rows,
  fillTo,
  lapCount,
  showRank,
}: Readonly<{ rows: LeaderboardAthlete[]; fillTo: number; lapCount: number; showRank: boolean }>) {
  const blanks = Math.max(0, fillTo - rows.length);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800">
      <HeaderRow showRank={showRank} />
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateRows: `repeat(${fillTo}, minmax(0, 1fr))` }}
      >
        {rows.map((a) => (
          <LeaderboardRow key={a.athleteId} a={a} lapCount={lapCount} showRank={showRank} />
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden className="border-b border-slate-800/40" />
        ))}
      </div>
    </div>
  );
}

function PageIndicator({
  page,
  totalPages,
  onDot,
}: Readonly<{ page: number; totalPages: number; onDot: (p: number) => void }>) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 py-3 text-slate-400">
      {totalPages <= 8 ? (
        Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onDot(i)}
            aria-label={`หน้า ${i + 1}`}
            aria-current={i === page ? "true" : undefined}
            className={`h-2 rounded-full transition-all ${
              i === page ? "w-6 bg-emerald-400" : "w-2 bg-slate-600 hover:bg-slate-500"
            }`}
          />
        ))
      ) : (
        <span className="text-sm font-medium">
          หน้า <span className="text-slate-100">{page + 1}</span> / {totalPages}
        </span>
      )}
    </div>
  );
}

/** Desktop view: 2 tables × 10 rows, paginated, auto-advancing every 10s. */
function DesktopPaged({
  athletes,
  lapCount,
  showRank,
}: Readonly<{ athletes: LeaderboardAthlete[]; lapCount: number; showRank: boolean }>) {
  const total = athletes.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [page, setPage] = useState(0);
  // Read latest totalPages inside the interval without it being an effect dep —
  // so the board's data polls (and athlete-count changes) never reset the
  // 10s autoplay phase. The interval is created exactly once.
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  useEffect(() => {
    const id = setInterval(() => {
      setPage((p) => (p + 1) % Math.max(1, totalPagesRef.current));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageRows = athletes.slice(start, start + PAGE_SIZE);
  const leftRows = pageRows.slice(0, COLUMN_SIZE);
  const rightRows = pageRows.slice(COLUMN_SIZE);

  // Always two columns, both padded to COLUMN_SIZE rows — the board fills the
  // screen and shows empty rows when an entry is missing (right column included).
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 gap-4 p-2">
        <ColumnTable rows={leftRows} fillTo={COLUMN_SIZE} lapCount={lapCount} showRank={showRank} />
        <ColumnTable rows={rightRows} fillTo={COLUMN_SIZE} lapCount={lapCount} showRank={showRank} />
      </div>
      <PageIndicator page={safePage} totalPages={totalPages} onDot={setPage} />
    </div>
  );
}

export function LeaderboardRows({
  athletes,
  lapCount,
  showRank = false,
}: Readonly<{ athletes: LeaderboardAthlete[]; lapCount: number; showRank?: boolean }>) {
  if (athletes.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-slate-500">
        ยังไม่มีข้อมูลการแข่งขันในรอบนี้
      </div>
    );
  }

  return (
    <>
      {/* Below 992px: single column, ALL rows, scrolls via the parent. */}
      <div className="min-[992px]:hidden">
        <HeaderRow showRank={showRank} sticky />
        {athletes.map((a) => (
          <LeaderboardRow key={a.athleteId} a={a} lapCount={lapCount} showRank={showRank} />
        ))}
      </div>

      {/* 992px and up: two fixed-order tables, paginated + autoplay, full height. */}
      <div className="hidden h-full min-[992px]:block">
        <DesktopPaged athletes={athletes} lapCount={lapCount} showRank={showRank} />
      </div>
    </>
  );
}

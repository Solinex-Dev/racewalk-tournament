"use client";

import * as React from "react";
import Link from "next/link";
import { MAX_RED } from "@/components/judge/card-matrix";

type JudgeWorkspaceProps = {
  eventId: string;
  event:
    | {
        id: string;
        name: string;
        heat_name: string;
        lapCount: number;
        currentLap: number;
        distance_km: string;
      }
    | null;
};

type RedCardDetail = {
  symbol: "~" | ">";
  isFromThisJudge?: boolean;
};

type JudgeAthleteRow = {
  bib: string;
  status: "OK" | "DQ" | "DNF";
  yellowKnee: boolean;
  yellowFoot: boolean;
  red: number;
  redDetails?: RedCardDetail[];
  judgeRedCount?: number;
};

const INITIAL_ATHLETES: JudgeAthleteRow[] = [
  { bib: "01", status: "OK", yellowKnee: true,  yellowFoot: false, red: 0, redDetails: [], judgeRedCount: 0 },
  { bib: "02", status: "OK", yellowKnee: true,  yellowFoot: true,  red: 1, redDetails: [{ symbol: ">", isFromThisJudge: true }], judgeRedCount: 1 },
  { bib: "03", status: "OK", yellowKnee: false, yellowFoot: false, red: 0, redDetails: [], judgeRedCount: 0 },
  { bib: "05", status: "OK", yellowKnee: false, yellowFoot: true,  red: 2, redDetails: [{ symbol: "~", isFromThisJudge: true }, { symbol: ">", isFromThisJudge: false }], judgeRedCount: 1 },
  { bib: "04", status: "DQ", yellowKnee: true,  yellowFoot: true,  red: 4, redDetails: [{ symbol: ">", isFromThisJudge: true }, { symbol: "~", isFromThisJudge: false }, { symbol: ">", isFromThisJudge: false }, { symbol: "~", isFromThisJudge: false }], judgeRedCount: 1 },
];

export function JudgeWorkspace({ eventId, event }: JudgeWorkspaceProps) {
  const [rows, setRows] = React.useState<JudgeAthleteRow[]>(INITIAL_ATHLETES);
  const [selectedBib, setSelectedBib] = React.useState<string | null>(null);
  const judgeName = "กรรมการตัวอย่าง (Mock)";

  const selectedAthlete = rows.find((r) => r.bib === selectedBib) ?? null;

  const handleSelectRow = (bib: string) => {
    setSelectedBib((prev) => (prev === bib ? null : bib));
  };

  const handleYellowKnee = (bib: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib || row.yellowKnee) return row;
        return { ...row, yellowKnee: true };
      }),
    );
  };

  const handleYellowFoot = (bib: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib || row.yellowFoot) return row;
        return { ...row, yellowFoot: true };
      }),
    );
  };

  const handleRedCard = (bib: string, symbol: "~" | ">") => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib) return row;
        if ((row.judgeRedCount || 0) >= 1) return row;

        const newRedDetails = [
          ...(row.redDetails || []),
          { symbol, isFromThisJudge: true },
        ];
        const newRed = Math.min(newRedDetails.length, MAX_RED);
        const newStatus = newRed >= 4 ? "DQ" : row.status;

        return {
          ...row,
          red: newRed,
          redDetails: newRedDetails,
          judgeRedCount: 1,
          status: newStatus,
        };
      }),
    );
  };

  const isDQSelected = selectedAthlete?.status === "DQ";
  const hasGivenSelected = (selectedAthlete?.judgeRedCount || 0) >= 1;
  const judgeCardSelected = selectedAthlete?.redDetails?.find((d) => d.isFromThisJudge);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className={`mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8 ${selectedBib ? "pb-36" : ""}`}>
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
                  – {event.heat_name}
                </p>
                <p className="text-sm text-slate-400">
                  รหัสกิจกรรม:{" "}
                  <span className="font-mono text-[11px]">{event.id}</span> •
                  ระยะ {event.distance_km} กม. • Lap {event.currentLap} /{" "}
                  {event.lapCount}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-red-400">ไม่พบข้อมูล Event จาก URL ที่ระบุ</p>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-3 text-sm">
            <div className="items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200 sm:flex">
              <span className="text-slate-400">กรรมการ</span>
              <span className="font-medium text-slate-100">{judgeName}</span>
            </div>
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              เปิดหน้า Live / Public
            </Link>
          </div>
        </header>

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
                      <th className="px-3 py-2 text-left text-sm text-nowrap">BIB</th>
                      <th className="px-3 py-2 text-left text-sm text-nowrap">สถานะ</th>
                      <th className="px-3 py-2 text-left text-sm text-nowrap text-amber-400">ใบเตือน</th>
                      <th className="px-3 py-2 text-left text-sm text-nowrap text-red-400">ใบแดง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map((athlete) => {
                      const isDQ = athlete.status === "DQ";
                      const hasGiven = (athlete.judgeRedCount || 0) >= 1;
                      const judgeCard = athlete.redDetails?.find((d) => d.isFromThisJudge);
                      const isSelected = selectedBib === athlete.bib;
                      return (
                        <tr
                          key={athlete.bib}
                          onClick={() => handleSelectRow(athlete.bib)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-slate-700/60 ring-1 ring-inset ring-slate-500"
                              : isDQ
                              ? "bg-slate-800/30 opacity-60 hover:bg-slate-800/50"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className={`px-3 py-2 font-mono text-base font-bold ${
                            isDQ ? "text-slate-500" : "text-amber-400"
                          }`}>
                            {athlete.bib}
                          </td>

                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ${
                              isDQ
                                ? "bg-red-950 text-red-400 ring-red-800"
                                : "bg-emerald-950 text-emerald-400 ring-emerald-800"
                            }`}>
                              {athlete.status}
                            </span>
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex flex-row gap-2">
                              <span title="งอเข่า" className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                                athlete.yellowKnee ? "bg-amber-400 text-slate-900" : "ring-2 ring-amber-900 text-amber-900"
                              }`}>{`>`}</span>
                              <span title="ยกเท้า" className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                                athlete.yellowFoot ? "bg-amber-400 text-slate-900" : "ring-2 ring-amber-900 text-amber-900"
                              }`}>{"~"}</span>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold text-white ${
                              hasGiven ? "bg-red-500 ring-2 ring-yellow-400" : "ring-2 ring-red-900"
                            }`}>
                              {hasGiven && judgeCard?.symbol ? judgeCard.symbol : ""}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
            {/* Header bar */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-amber-400">
                  BIB {selectedAthlete.bib}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                  isDQSelected
                    ? "bg-red-950 text-red-400 ring-red-800"
                    : "bg-emerald-950 text-emerald-400 ring-emerald-800"
                }`}>
                  {selectedAthlete.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBib(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {/* ใบเตือน */}
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-center text-base font-medium text-amber-400/70">
                  ใบเตือน
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isDQSelected || selectedAthlete.yellowKnee}
                    title="งอเข่า"
                    onClick={() => handleYellowKnee(selectedAthlete.bib)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isDQSelected || selectedAthlete.yellowKnee
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-amber-700 bg-amber-950 text-amber-400 active:bg-amber-800"
                    }`}
                  >
                    <span className="text-base">{`>`}</span>
                    <span>งอเข่า</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDQSelected || selectedAthlete.yellowFoot}
                    title="ยกเท้า"
                    onClick={() => handleYellowFoot(selectedAthlete.bib)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isDQSelected || selectedAthlete.yellowFoot
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-amber-700 bg-amber-950 text-amber-400 active:bg-amber-800"
                    }`}
                  >
                    <span className="text-base">{"~"}</span>
                    <span>ยกเท้า</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch bg-slate-700" />

              {/* ใบแดง */}
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-center text-base font-medium text-red-400/70">
                  ใบแดง
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isDQSelected || hasGivenSelected}
                    title="งอเข่า"
                    onClick={() => handleRedCard(selectedAthlete.bib, ">")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isDQSelected || hasGivenSelected
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-red-700 bg-red-950 text-red-400 active:bg-red-800"
                    }`}
                  >
                    <span className="text-base">{`>`}</span>
                    <span>งอเข่า</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDQSelected || hasGivenSelected}
                    title="ยกเท้า"
                    onClick={() => handleRedCard(selectedAthlete.bib, "~")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                      isDQSelected || hasGivenSelected
                        ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-600"
                        : "border-red-700 bg-red-950 text-red-400 active:bg-red-800"
                    }`}
                  >
                    <span className="text-base">{"~"}</span>
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

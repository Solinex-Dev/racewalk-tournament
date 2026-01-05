"use client";

import * as React from "react";
import Link from "next/link";
import {
  JudgeCardMatrix,
  MAX_YELLOW,
  MAX_RED,
} from "@/components/judge/card-matrix";

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
  symbol: "~" | ">"; // งอเข่า (>) หรือยกเท้า (~)
  isFromThisJudge?: boolean; // ใบแดงนี้เป็นของกรรมการคนนี้หรือไม่
};

type JudgeAthleteRow = {
  bib: string;
  status: "OK" | "DQ" | "DNF";
  yellow: number;
  red: number;
  redDetails?: RedCardDetail[]; // รายละเอียดของแต่ละใบแดง (มีสัญลักษณ์)
  judgeRedCount?: number; // จำนวนใบแดงที่กรรมการคนนี้ให้ไปแล้ว (สูงสุด 1 ใบ)
};

const INITIAL_ATHLETES: JudgeAthleteRow[] = [
  {
    bib: "01",
    status: "OK",
    yellow: 1,
    red: 0,
    redDetails: [],
    judgeRedCount: 0,
  },
  {
    bib: "02",
    status: "OK",
    yellow: 2,
    red: 1,
    redDetails: [{ symbol: ">", isFromThisJudge: true }],
    judgeRedCount: 1,
  },
  {
    bib: "03",
    status: "OK",
    yellow: 0,
    red: 0,
    redDetails: [],
    judgeRedCount: 0,
  },
  {
    bib: "05",
    status: "OK",
    yellow: 1,
    red: 2,
    redDetails: [
      { symbol: "~", isFromThisJudge: true }, // ใบแดงของกรรมการคนนี้ (มี border สีเหลือง)
      { symbol: ">", isFromThisJudge: false }, // ใบแดงของกรรมการคนอื่น
    ],
    judgeRedCount: 1,
  },
  {
    bib: "04",
    status: "DQ",
    yellow: 2,
    red: 4,
    redDetails: [
      { symbol: ">", isFromThisJudge: true },
      { symbol: "~", isFromThisJudge: false },
      { symbol: ">", isFromThisJudge: false },
      { symbol: "~", isFromThisJudge: false },
    ],
    judgeRedCount: 1,
  },
];

export function JudgeWorkspace({ eventId, event }: JudgeWorkspaceProps) {
  const [rows, setRows] = React.useState<JudgeAthleteRow[]>(INITIAL_ATHLETES);
  // TODO: ภายหลังให้ดึงชื่อกรรมการจาก session / backend ตามโค้ดที่ใช้ join
  const judgeName = "กรรมการตัวอย่าง (Mock)";

  const handleYellowCard = (bib: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib) return row;
        // เพิ่มใบเหลือง (เป็น note ไม่มีสัญลักษณ์)
        const newYellow = Math.min((row.yellow || 0) + 1, MAX_YELLOW);
        return { 
          ...row, 
          yellow: newYellow,
        };
      }),
    );
  };

  const handleRedCard = (bib: string, symbol: "~" | ">") => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib) return row;

        // ตรวจสอบว่ากรรมการให้ใบแดงไปแล้วหรือยัง
        const currentJudgeRedCount = row.judgeRedCount || 0;
        if (currentJudgeRedCount >= 1) {
          return row; // ไม่สามารถให้ได้อีก
        }

        const newRedDetails = [
          ...(row.redDetails || []),
          { symbol, isFromThisJudge: true }, // ใบแดงนี้เป็นของกรรมการคนนี้
        ];
        const newRed = Math.min(newRedDetails.length, MAX_RED);
        const newJudgeRedCount = 1; // กรรมการให้ได้ 1 ใบต่อคน

        let newStatus = row.status;
        if (newRed >= 4) {
          newStatus = "DQ";
        }

        return { 
          ...row, 
          red: newRed, 
          redDetails: newRedDetails,
          judgeRedCount: newJudgeRedCount,
          status: newStatus 
        };
      }),
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
              หน้ากรรมการ
            </h1>
            {event ? (
              <>
                <p className="mt-1 text-sm text-slate-300">
                  กิจกรรม:{" "}
                  <span className="font-semibold text-slate-100">
                    {event.name}
                  </span>{" "}
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
              <p className="mt-1 text-sm text-red-400">
                ไม่พบข้อมูล Event จาก URL ที่ระบุ
              </p>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-3 text-sm">
            <div className="items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200 sm:flex">
              <span className="text-slate-400">กรรมการ</span>
              <span className="font-medium text-slate-100">{judgeName}</span>
            </div>
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
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
                      <th className="px-1 py-1 text-left text-sm text-nowrap">BIB</th>
                      <th className="px-1 py-1 text-left text-sm text-nowrap">สถานะ</th>
                      <th className="px-1 py-1 text-left text-sm text-nowrap">
                        เหลือง/แดง
                      </th>
                      <th className="px-1 py-1 text-center text-sm text-nowrap">การให้ใบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map((athlete) => {
                      const isDQ = athlete.status === "DQ";
                      return (
                        <tr
                          key={athlete.bib}
                          className={`transition-colors ${
                            isDQ
                              ? "bg-slate-800/30 opacity-60"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className={`px-1 py-1 font-mono text-lg ${
                            isDQ ? "text-slate-500" : "text-amber-400"
                          }`}>
                            {athlete.bib}
                          </td>
                          
                          <td className="px-1 py-1">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text font-medium ring-1 ${
                              isDQ
                                ? "bg-red-950 text-red-400 ring-red-800"
                                : "bg-emerald-950 text-emerald-400 ring-emerald-800"
                            }`}>
                              {athlete.status}
                            </span>
                          </td>
                          <td className={`px-1 py-1 text-[11px] ${
                            isDQ ? "text-slate-500" : "text-slate-100"
                          }`}>
                            <div className="flex items-center gap-2">
                              <JudgeCardMatrix
                                yellow={athlete.yellow}
                                red={athlete.red}
                                redDetails={athlete.redDetails}
                              />
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex flex-row justify-center items-center gap-2">
                              <button
                                type="button"
                                disabled={isDQ || athlete.yellow >= MAX_YELLOW}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-[16px] font-semibold ${
                                  isDQ || athlete.yellow >= MAX_YELLOW
                                    ? "cursor-not-allowed border-slate-700 bg-slate-900 text-slate-600"
                                    : "border-amber-700 bg-amber-950 text-amber-400 hover:bg-amber-900"
                                }`}
                                onClick={() => handleYellowCard(athlete.bib)}
                              >
                                Y
                              </button>
                              <button
                                type="button"
                                disabled={isDQ || (athlete.judgeRedCount || 0) >= 1}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-[16px] font-semibold ${
                                  isDQ || (athlete.judgeRedCount || 0) >= 1
                                    ? "cursor-not-allowed border-slate-700 bg-slate-900 text-slate-600"
                                    : "border-red-700 bg-red-950 text-red-400 hover:bg-red-900"
                                }`}
                                onClick={() => handleRedCard(athlete.bib, "~")}
                                title="ยกเท้า / เท้าไม่ติดพื้น"
                              >
                                ~
                              </button>
                              <button
                                type="button"
                                disabled={isDQ || (athlete.judgeRedCount || 0) >= 1}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-[16px] font-semibold ${
                                  isDQ || (athlete.judgeRedCount || 0) >= 1
                                    ? "cursor-not-allowed border-slate-700 bg-slate-900 text-slate-600"
                                    : "border-red-700 bg-red-950 text-red-400 hover:bg-red-900"
                                }`}
                                onClick={() => handleRedCard(athlete.bib, ">")}
                                title="เข่างอ"
                              >
                                &gt;
                              </button>
                            </div>
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
    </main>
  );
}



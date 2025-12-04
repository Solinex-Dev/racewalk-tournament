"use client";

import * as React from "react";
import Link from "next/link";
import {
  JudgeCardMatrix,
  MAX_YELLOW,
  MAX_RED,
  type YellowCardDetail,
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

type JudgeAthleteRow = {
  bib: string;
  name: string;
  affiliation: string;
  status: "OK" | "DQ" | "DNF";
  yellow: number;
  red: number;
  yellowDetails?: YellowCardDetail[]; // รายละเอียดของแต่ละใบเหลือง
};

const INITIAL_ATHLETES: JudgeAthleteRow[] = [
  {
    bib: "101",
    name: "Somchai Rakdee",
    affiliation: "ชมรมเดินทนกรุงเทพฯ",
    status: "OK",
    yellow: 1,
    red: 0,
    yellowDetails: [{ symbol: "~" }],
  },
  {
    bib: "102",
    name: "Jane Doe",
    affiliation: "Example Athletic Club",
    status: "OK",
    yellow: 3,
    red: 1,
    yellowDetails: [{ symbol: "~" }, { symbol: "-" }, { symbol: "-" }],
  },
  {
    bib: "103",
    name: "Chanida Runfast",
    affiliation: "Chiangmai Racewalk Team",
    status: "OK",
    yellow: 0,
    red: 0,
    yellowDetails: [],
  },
  {
    bib: "104",
    name: "Luis Garcia",
    affiliation: "Madrid Racewalk Club",
    status: "DQ",
    yellow: 6,
    red: 2,
    yellowDetails: [
      { symbol: ">" },
      { symbol: "-" },
      { symbol: "-" },
      { symbol: "~" },
      { symbol: "-" },
      { symbol: "-" },
    ],
  },
];


export function JudgeWorkspace({ eventId, event }: JudgeWorkspaceProps) {
  const [rows, setRows] = React.useState<JudgeAthleteRow[]>(INITIAL_ATHLETES);
  // TODO: ภายหลังให้ดึงชื่อกรรมการจาก session / backend ตามโค้ดที่ใช้ join
  const judgeName = "กรรมการตัวอย่าง (Mock)";

  const giveYellowCard = (bib: string, symbol: "~" | ">") => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib) return row;

        // เพิ่มใบเหลือง พร้อมบันทึกสัญลักษณ์
        const newYellowDetails = [
          ...(row.yellowDetails || []),
          { symbol },
        ];
        const newYellow = Math.min(newYellowDetails.length, MAX_YELLOW);
        
        // คำนวณใบแดงที่ได้จากใบเหลืองครบ 3 (เฉพาะใบที่ไม่ใช่ "-")
        const actualYellowCards = newYellowDetails.filter(d => d.symbol !== "-").length;
        const redFromYellow = Math.floor(actualYellowCards / 3);
        const newRed = Math.max(row.red, redFromYellow); // ใช้ค่าที่มากกว่า
        
        let newStatus = row.status;
        if (newRed >= 2) {
          newStatus = "DQ";
        }
        
        return { 
          ...row, 
          yellow: newYellow, 
          yellowDetails: newYellowDetails,
          red: newRed,
          status: newStatus
        };
      }),
    );
  };

  const giveRedCard = (bib: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการให้ใบแดงกับนักกีฬา BIB ${bib}?`)) {
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib) return row;

        // type === "R" - ให้ใบแดงโดยตรงจากกรรมการอาวุโส
        const currentYellowDetails = row.yellowDetails || [];
        
        // คำนวณใบแดงที่มีอยู่แล้ว (จากใบเหลืองครบ 3)
        const actualYellowCards = currentYellowDetails.filter(d => d.symbol !== "-").length;
        const redFromYellow = Math.floor(actualYellowCards / 3);
        
        // ใบแดงใหม่ = ใบแดงที่มีอยู่ + 1 (ใบแดงที่กรรมการให้โดยตรง)
        const newRed = Math.min(Math.max(row.red, redFromYellow) + 1, MAX_RED);
        
        // คำนวณจำนวนใบเหลืองที่ต้องมี (3 ใบต่อ 1 แดง)
        const minYellowFromRed = newRed * 3;
        
        // ถ้าใบเหลืองปัจจุบันน้อยกว่าที่ต้องมี ให้เติม "-" ให้ครบ
        const newYellowDetails = [...currentYellowDetails];
        while (newYellowDetails.length < minYellowFromRed) {
          newYellowDetails.push({ symbol: "-" });
        }
        
        const newYellow = Math.min(newYellowDetails.length, MAX_YELLOW);

        let newStatus = row.status;
        if (newRed >= 2) {
          newStatus = "DQ";
        }

        return { 
          ...row, 
          red: newRed, 
          yellow: newYellow, 
          yellowDetails: newYellowDetails,
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              การแข่งขันเดินทน – หน้าทำงานกรรมการ
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
              หน้าทำงานของกรรมการ
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
                <p className="text-xs text-slate-400">
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

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200 sm:flex">
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

        <section className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
              <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  รายชื่อนักกีฬาประจำโต๊ะ / จุดของกรรมการ
                </p>
                <p className="text-[11px] text-slate-500">
                  แสดงจำนวนใบเหลือง/ใบแดง ที่กรรมการโต๊ะนี้ให้ไปแล้ว
                  และใช้ปุ่มด้านขวาในการบันทึกใบใหม่ (mock)
                </p>
              </div>

              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-medium uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">BIB</th>
                      {/* <th className="px-3 py-2 text-left">นักกีฬา</th>
                      <th className="px-3 py-2 text-left hidden sm:table-cell">
                        สังกัด
                      </th> */}
                      <th className="px-3 py-2 text-left">สถานะ</th>
                      <th className="px-3 py-2 text-left hidden md:table-cell">
                        ใบเหลือง / ใบแดง (จากโต๊ะนี้)
                      </th>
                      <th className="px-3 py-2 text-center">ให้ใบเหลือง</th>
                      <th className="px-3 py-2 text-center">ให้ใบแดง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map((athlete) => (
                      <tr
                        key={athlete.bib}
                        className="transition-colors hover:bg-slate-800/50"
                      >
                        <td className="px-3 py-2 font-mono text-sm text-amber-400">
                          {athlete.bib}
                        </td>
                        {/* <td className="px-3 py-2">
                          <p className="text-xs font-medium text-slate-100">
                            {athlete.name}
                          </p>
                          <p className="text-[10px] text-slate-400 sm:hidden">
                            {athlete.affiliation}
                          </p>
                        </td>
                        <td className="hidden px-3 py-2 text-[11px] text-slate-300 sm:table-cell">
                          {athlete.affiliation}
                        </td> */}
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-800">
                            {athlete.status}
                          </span>
                        </td>
                        <td className="hidden px-3 py-2 text-[11px] text-slate-100 md:table-cell">
                          <div className="flex items-center gap-2">
                            <JudgeCardMatrix
                              yellow={athlete.yellow}
                              red={athlete.red}
                              yellowDetails={athlete.yellowDetails}
                            />
                            <span className="text-[10px] text-slate-400">
                              <span className="font-medium text-amber-400">
                                Y {athlete.yellow}
                              </span>
                              {" / "}
                              <span className="font-medium text-red-400">
                                R {athlete.red}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-amber-600 bg-amber-950 text-xl font-bold text-amber-400 hover:bg-amber-900 hover:border-amber-500 transition-colors"
                              onClick={() => giveYellowCard(athlete.bib, "~")}
                              title="Loss of Contact - เท้าไม่ติดพื้น"
                            >
                              ~
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-amber-600 bg-amber-950 text-xl font-bold text-amber-400 hover:bg-amber-900 hover:border-amber-500 transition-colors"
                              onClick={() => giveYellowCard(athlete.bib, ">")}
                              title="Bent Knee - เข่างอ"
                            >
                              &gt;
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-red-600 bg-red-950 text-sm font-semibold text-red-400 hover:bg-red-900 hover:border-red-500 transition-colors"
                            onClick={() => giveRedCard(athlete.bib)}
                            title="ให้ใบแดง"
                          >
                            +R
                          </button>
                        </td>
                      </tr>
                    ))}
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



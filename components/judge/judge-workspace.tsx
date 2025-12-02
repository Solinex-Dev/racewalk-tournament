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

type PendingAction = {
  bib: string;
  type: "Y" | "R";
  yellowSymbol?: "~" | ">"; // เพิ่ม field สำหรับเก็บสัญลักษณ์ใบเหลือง
} | null;

export function JudgeWorkspace({ eventId, event }: JudgeWorkspaceProps) {
  const [rows, setRows] = React.useState<JudgeAthleteRow[]>(INITIAL_ATHLETES);
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [selectedYellowSymbol, setSelectedYellowSymbol] = React.useState<"~" | ">" | null>(null);

  const openConfirm = (bib: string, type: "Y" | "R") => {
    setPendingAction({ bib, type });
    // Reset selected symbol when opening new confirmation
    if (type === "Y") {
      setSelectedYellowSymbol(null);
    }
  };

  const closeConfirm = () => {
    setPendingAction(null);
    setSelectedYellowSymbol(null);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    const { bib, type } = pendingAction;

    // ถ้าเป็นใบเหลืองแต่ยังไม่ได้เลือกสัญลักษณ์ ให้ return
    if (type === "Y" && !selectedYellowSymbol) {
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        if (row.bib !== bib) return row;

        if (type === "Y") {
          // เพิ่มใบเหลือง พร้อมบันทึกสัญลักษณ์
          const newYellowDetails = [
            ...(row.yellowDetails || []),
            { symbol: selectedYellowSymbol! },
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
        }

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

    setPendingAction(null);
    setSelectedYellowSymbol(null);
  };

  const pendingRow =
    pendingAction &&
    rows.find((row) => row.bib === pendingAction.bib) !== undefined
      ? rows.find((row) => row.bib === pendingAction.bib)!
      : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              การแข่งขันเดินทน – หน้าทำงานกรรมการ
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              หน้าทำงานของกรรมการ
            </h1>
            {event ? (
              <>
                <p className="mt-1 text-sm text-slate-600">
                  กิจกรรม:{" "}
                  <span className="font-semibold text-slate-900">
                    {event.name}
                  </span>{" "}
                  – {event.heat_name}
                </p>
                <p className="text-xs text-slate-500">
                  รหัสกิจกรรม:{" "}
                  <span className="font-mono text-[11px]">{event.id}</span> •
                  ระยะ {event.distance_km} กม. • Lap {event.currentLap} /{" "}
                  {event.lapCount}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-red-600">
                ไม่พบข้อมูล Event จาก URL ที่ระบุ
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              เปิดหน้า Live / Public
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  รายชื่อนักกีฬาประจำโต๊ะ / จุดของกรรมการ
                </p>
                <p className="text-[11px] text-slate-500">
                  แสดงจำนวนใบเหลือง/ใบแดง ที่กรรมการโต๊ะนี้ให้ไปแล้ว
                  และใช้ปุ่มด้านขวาในการบันทึกใบใหม่ (mock)
                </p>
              </div>

              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">BIB</th>
                      <th className="px-3 py-2 text-left">นักกีฬา</th>
                      <th className="px-3 py-2 text-left hidden sm:table-cell">
                        สังกัด
                      </th>
                      <th className="px-3 py-2 text-left">สถานะ</th>
                      <th className="px-3 py-2 text-left hidden md:table-cell">
                        ใบเหลือง / ใบแดง (จากโต๊ะนี้)
                      </th>
                      <th className="px-3 py-2 text-center">+Y</th>
                      <th className="px-3 py-2 text-center">+R</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((athlete) => (
                      <tr
                        key={athlete.bib}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 font-mono text-sm text-amber-700">
                          {athlete.bib}
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-medium text-slate-900">
                            {athlete.name}
                          </p>
                          <p className="text-[10px] text-slate-500 sm:hidden">
                            {athlete.affiliation}
                          </p>
                        </td>
                        <td className="hidden px-3 py-2 text-[11px] text-slate-700 sm:table-cell">
                          {athlete.affiliation}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                            {athlete.status}
                          </span>
                        </td>
                        <td className="hidden px-3 py-2 text-[11px] text-slate-900 md:table-cell">
                          <div className="flex items-center gap-2">
                            <JudgeCardMatrix
                              yellow={athlete.yellow}
                              red={athlete.red}
                              yellowDetails={athlete.yellowDetails}
                            />
                            <span className="text-[10px] text-slate-500">
                              <span className="font-medium text-amber-700">
                                Y {athlete.yellow}
                              </span>
                              {" / "}
                              <span className="font-medium text-red-700">
                                R {athlete.red}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                            onClick={() => openConfirm(athlete.bib, "Y")}
                          >
                            +Y
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            onClick={() => openConfirm(athlete.bib, "R")}
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

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                สรุปสำหรับกรรมการ
              </p>
              <p className="mt-2 text-xs text-slate-600">
                หน้านี้เป็น mock สำหรับ workspace ของกรรมการ – ในเวอร์ชันจริงจะมี
                การ sync แบบ real-time กับระบบกลาง
                และรวมจำนวนใบเหลือง/แดงจากกรรมการทุกโต๊ะ
              </p>
              <ul className="mt-2 list-inside list-disc text-[11px] text-slate-600">
                <li>ปุ่ม +Y / +R ใช้บันทึกใบเหลือง/ใบแดง ให้กับนักกีฬา</li>
                <li>
                  สามารถดู scoreboard สาธารณะได้จากลิงก์ “เปิดหน้า Live” ด้านบน
                </li>
              </ul>
            </div>
          </aside>
        </section>

        {pendingAction && pendingRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h2 className="text-sm font-semibold text-slate-900">
                ยืนยันการให้ใบ{" "}
                {pendingAction.type === "Y" ? "เหลือง (Yellow card)" : "แดง (Red card)"}
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                คุณกำลังจะให้ใบ{" "}
                <span className="font-semibold">
                  {pendingAction.type === "Y" ? "เหลือง" : "แดง"}
                </span>{" "}
                กับนักกีฬา:
              </p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <p className="font-medium text-slate-900">
                  {pendingRow.name}{" "}
                  <span className="font-mono text-[11px] text-amber-700">
                    (BIB {pendingRow.bib})
                  </span>
                </p>
                <p className="text-[11px] text-slate-600">
                  {pendingRow.affiliation}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  ใบเหลืองปัจจุบัน:{" "}
                  <span className="font-semibold text-amber-700">
                    {pendingRow.yellow}
                  </span>{" "}
                  | ใบแดงปัจจุบัน:{" "}
                  <span className="font-semibold text-red-700">
                    {pendingRow.red}
                  </span>
                </p>
              </div>

              {/* เลือกสัญลักษณ์ใบเหลือง */}
              {pendingAction.type === "Y" && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-900">
                    คุณเห็นการฝ่าฝืนข้อใด?
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    เลือกสัญลักษณ์ที่ตรงกับการฝ่าฝืนที่คุณเห็น
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedYellowSymbol("~")}
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                        selectedYellowSymbol === "~"
                          ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                      }`}
                    >
                      <span className="text-3xl font-bold text-amber-600">~</span>
                      <span className="mt-2 text-[11px] font-semibold text-slate-900">
                        Loss of Contact
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-600">
                        เท้าไม่ติดพื้น
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedYellowSymbol(">")}
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                        selectedYellowSymbol === ">"
                          ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                      }`}
                    >
                      <span className="text-3xl font-bold text-amber-600">&gt;</span>
                      <span className="mt-2 text-[11px] font-semibold text-slate-900">
                        Bent Knee
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-600">
                        เข่างอ
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-4 text-[11px] text-slate-600">
                หมายเหตุ: ตามกติกา 3 เหลือง = 1 แดง และ ใบแดงครบ 2 ใบ
                นักกีฬาจะหมดสิทธิ์แข่งขัน (logic จริงจะไปคำนวณที่ backend อีกที)
              </p>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmAction}
                  disabled={pendingAction.type === "Y" && !selectedYellowSymbol}
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-50 ${
                    pendingAction.type === "Y" && !selectedYellowSymbol
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  ยืนยันการให้ใบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}



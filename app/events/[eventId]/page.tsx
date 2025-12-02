import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JudgeCardMatrix,
  MAX_YELLOW,
  MAX_RED,
  type YellowCardDetail,
} from "@/components/judge/card-matrix";

type PublicEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "scheduled" | "ongoing" | "finished";
  heat_name: string;
  lapCount: number;
  currentLap: number;
  elapsed: string;
  athletes: {
    bib: string;
    name: string;
    affiliation: string;
    country: string;
    yellowCards: number;
    redCards: number;
    yellowDetails?: YellowCardDetail[];
    position: number;
    splitTime: string;
    totalTime: string;
    status: "OK" | "DQ" | "DNF";
  }[];
};

const MOCK_PUBLIC_EVENT: Record<string, PublicEvent> = {
  "evt-001": {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    date: "15 มีนาคม 2025",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "ongoing",
    heat_name: "รุ่นทั่วไป ระยะ 20 กม.",
    lapCount: 20,
    currentLap: 7,
    elapsed: "00:46:32",
    athletes: [
      {
        bib: "101",
        name: "Somchai Rakdee",
        affiliation: "ชมรมเดินทนกรุงเทพฯ",
        country: "THA",
        yellowCards: 2,
        redCards: 0,
        yellowDetails: [{ symbol: "~" }, { symbol: ">" }],
        position: 1,
        splitTime: "02:14",
        totalTime: "00:46:32",
        status: "OK",
      },
      {
        bib: "102",
        name: "Jane Doe",
        affiliation: "Example Athletic Club",
        country: "USA",
        yellowCards: 3,
        redCards: 1,
        yellowDetails: [{ symbol: ">" }, { symbol: "-" }, { symbol: "-" }],
        position: 2,
        splitTime: "02:18",
        totalTime: "00:46:45",
        status: "OK",
      },
      {
        bib: "103",
        name: "Chanida Runfast",
        affiliation: "Chiangmai Racewalk Team",
        country: "THA",
        yellowCards: 4,
        redCards: 0,
        yellowDetails: [
          { symbol: "~" },
          { symbol: "~" },
          { symbol: ">" },
          { symbol: ">" },
        ],
        position: 3,
        splitTime: "02:20",
        totalTime: "00:47:02",
        status: "OK",
      },
      {
        bib: "104",
        name: "Luis Garcia",
        affiliation: "Madrid Racewalk Club",
        country: "ESP",
        yellowCards: 6,
        redCards: 2,
        yellowDetails: [
          { symbol: "~" },
          { symbol: "-" },
          { symbol: "-" },
          { symbol: ">" },
          { symbol: "-" },
          { symbol: "-" },
        ],
        position: 4,
        splitTime: "02:25",
        totalTime: "00:48:10",
        status: "DQ",
      },
      {
        bib: "105",
        name: "Mai Tanaka",
        affiliation: "Tokyo Walkers",
        country: "JPN",
        yellowCards: 0,
        redCards: 0,
        yellowDetails: [],
        position: 5,
        splitTime: "02:27",
        totalTime: "00:48:45",
        status: "OK",
      },
      {
        bib: "106",
        name: "Peter Schmidt",
        affiliation: "Berlin Walkers",
        country: "GER",
        yellowCards: 3,
        redCards: 1,
        yellowDetails: [{ symbol: ">" }, { symbol: "~" }, { symbol: "-" }],
        position: 6,
        splitTime: "02:29",
        totalTime: "00:49:15",
        status: "OK",
      },
      {
        bib: "107",
        name: "Anna Kowalski",
        affiliation: "Warsaw Track Club",
        country: "POL",
        yellowCards: 1,
        redCards: 0,
        yellowDetails: [{ symbol: "~" }],
        position: 7,
        splitTime: "02:31",
        totalTime: "00:49:45",
        status: "OK",
      },
    ],
  },
  "evt-002": {
    id: "evt-002",
    name: "Bangkok City Racewalk",
    date: "20 มกราคม 2025",
    location: "Bangkok City Route",
    distance_km: "10",
    status: "finished",
    heat_name: "รุ่นทั่วไป ระยะ 10 กม.",
    lapCount: 10,
    currentLap: 10,
    elapsed: "00:55:10",
    athletes: [
      {
        bib: "201",
        name: "Nattapong Citywalker",
        affiliation: "Bangkok Road Runners",
        country: "THA",
        yellowCards: 1,
        redCards: 0,
        yellowDetails: [{ symbol: ">" }],
        position: 1,
        splitTime: "02:30",
        totalTime: "00:52:40",
        status: "OK",
      },
      {
        bib: "202",
        name: "Maria Lopez",
        affiliation: "Ciudad Deportiva",
        country: "MEX",
        yellowCards: 2,
        redCards: 0,
        yellowDetails: [{ symbol: "~" }, { symbol: "-" }],
        position: 2,
        splitTime: "02:33",
        totalTime: "00:53:10",
        status: "OK",
      },
      {
        bib: "203",
        name: "Kittiya Fastwalk",
        affiliation: "Bangkok University Team",
        country: "THA",
        yellowCards: 3,
        redCards: 1,
        yellowDetails: [{ symbol: ">" }, { symbol: ">" }, { symbol: "-" }],
        position: 3,
        splitTime: "02:36",
        totalTime: "00:54:20",
        status: "OK",
      },
      {
        bib: "204",
        name: "John Smith",
        affiliation: "City Athletics Club",
        country: "GBR",
        yellowCards: 4,
        redCards: 2,
        yellowDetails: [
          { symbol: "~" },
          { symbol: "~" },
          { symbol: "-" },
          { symbol: ">" },
        ],
        position: 15,
        splitTime: "02:50",
        totalTime: "00:59:40",
        status: "DQ",
      },
    ],
  },
};

export const metadata: Metadata = {
  title: "กระดานคะแนนสดกิจกรรม – การแข่งขันเดินทน",
  description:
    "หน้าดูผลการแข่งขันเดินทนแบบสด (Live scoreboard) สำหรับผู้ชมและผู้ติดตาม.",
};

type EventLivePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventLivePage(props: EventLivePageProps) {
  const { eventId } = await props.params;

  const event = MOCK_PUBLIC_EVENT[eventId];

  if (!event) {
    // TODO: ภายหลังให้ดึงข้อมูลจากฐานข้อมูลจริง และอาจ redirect ไปหน้า default current event ถ้าไม่พบ
    notFound();
  }

  const statusLabel: Record<PublicEvent["status"], string> = {
    scheduled: "ยังไม่เริ่ม",
    ongoing: "กำลังแข่งขัน",
    finished: "จบการแข่งขันแล้ว",
  };

  const statusClassName: Record<PublicEvent["status"], string> = {
    scheduled:
      "bg-sky-950 text-sky-300 ring-sky-800",
    ongoing:
      "bg-emerald-950 text-emerald-400 ring-emerald-800",
    finished:
      "bg-slate-900 text-slate-200 ring-slate-700",
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-10">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              การแข่งขันเดินทน – สด
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
              {event.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {event.heat_name} • ระยะ {event.distance_km} กม. •{" "}
              {event.location}
            </p>
            <p className="text-xs text-slate-400">แข่งขันวันที่ {event.date}</p>
          </div>

          <div className="flex items-end gap-4">
            <div className="text-right text-xs">
              <p className="text-slate-400">
                Lap ปัจจุบัน{" "}
                <span className="font-semibold text-slate-100">
                  {event.currentLap}
                </span>{" "}
                / {event.lapCount}
              </p>
              <p className="text-slate-400">
                เวลาแข่งขัน{" "}
                <span className="font-mono text-sm font-semibold text-emerald-400">
                  {event.elapsed}
                </span>
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[event.status]}`}
            >
              ● {statusLabel[event.status]}
            </span>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                กระดานคะแนนสด
              </p>
              <p className="text-[11px] text-slate-500">
                อันดับเรียงตามเวลารวม (Total time) – ข้อมูลนี้เป็น mock
                สำหรับดีไซน์ UI
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/95 text-[11px] font-medium uppercase text-slate-400 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-left">อันดับ</th>
                    <th className="px-3 py-2 text-left">BIB</th>
                    <th className="px-3 py-2 text-left">นักกีฬา</th>
                    <th className="px-3 py-2 text-left hidden sm:table-cell">
                      สังกัด / สโมสร
                    </th>
                    <th className="px-3 py-2 text-left hidden md:table-cell">
                      ประเทศ
                    </th>
                    <th className="px-3 py-2 text-left">Lap ล่าสุด</th>
                    <th className="px-3 py-2 text-left hidden md:table-cell">
                      ใบเหลือง / ใบแดง
                    </th>
                    <th className="px-3 py-2 text-left">เวลารวม (Total)</th>
                    <th className="px-3 py-2 text-left hidden md:table-cell">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {event.athletes.map((athlete) => (
                    <tr
                      key={athlete.bib}
                      className="transition-colors hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-2 text-sm font-semibold text-slate-100">
                        {athlete.position}
                      </td>
                      <td className="px-3 py-2 font-mono text-sm text-amber-400">
                        {athlete.bib}
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs font-medium text-slate-100">
                          {athlete.name}
                        </p>
                        <p className="text-[10px] text-slate-400 sm:hidden">
                          {athlete.affiliation}
                        </p>
                      </td>
                      <td className="hidden px-3 py-2 text-[11px] text-slate-300 sm:table-cell">
                        {athlete.affiliation}
                      </td>
                      <td className="hidden px-3 py-2 text-[11px] text-slate-300 md:table-cell">
                        {athlete.country}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-100">
                        {athlete.splitTime}
                      </td>
                      <td className="hidden px-3 py-2 text-[11px] text-slate-100 md:table-cell">
                        <div className="flex items-center gap-2">
                          <JudgeCardMatrix
                            yellow={athlete.yellowCards}
                            red={athlete.redCards}
                            yellowDetails={athlete.yellowDetails}
                          />
                          <span className="text-[10px] text-slate-400">
                            <span className="font-medium text-amber-400">
                              Y{" "}
                              {Math.min(athlete.yellowCards, MAX_YELLOW)}
                            </span>
                            {" / "}
                            <span className="font-medium text-red-400">
                              R {Math.min(athlete.redCards, MAX_RED)}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-100">
                        {athlete.totalTime}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        {athlete.redCards >= 2 ? (
                          <span className="inline-flex rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-red-800">
                            หมดสิทธิ์แข่งขัน
                          </span>
                        ) : athlete.status === "OK" ? (
                          <span className="inline-flex rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-800">
                            OK
                          </span>
                        ) : athlete.status === "DQ" ? (
                          <span className="inline-flex rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-red-800">
                            DQ
                          </span>
                        ) : athlete.status === "DNF" ? (
                          <span className="inline-flex rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-800">
                            DNF
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            

            <div className="space-y-2 rounded-2xl border border-slate-800 from-slate-900 to-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                สำหรับกรรมการ
              </p>
              <p className="text-[11px] text-slate-300">
                ถ้าคุณเป็นกรรมการของ Event นี้ ให้เข้าไปยังหน้าสำหรับกรรมการ
                เพื่อใช้บันทึกผลการแข่งขัน
              </p>
              <div className="mt-2 flex flex-col gap-2 text-xs">
                <a
                  href={`/judge/events/${event.id}/join`}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-900 hover:bg-slate-200"
                >
                  ไปหน้ากรอกรหัสกรรมการ (Join event)
                </a>
                <a
                  href={`/judge/events/${event.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
                >
                  ไปหน้าใช้งานสำหรับกรรมการ (Judge workspace)
                </a>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}



import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  JudgeCardMatrix,
  MAX_YELLOW,
  MAX_RED,
  type YellowCardDetail,
} from "@/components/judge/card-matrix";

export const metadata: Metadata = {
  title: "แดชบอร์ดผู้ควบคุมกิจกรรม – การแข่งขันเดินทน",
  description:
    "หน้าสำหรับ Moderator ดูสถานะนักกีฬา ใบเหลือง/ใบแดง กรรมการ และ log กิจกรรมของ Event.",
};

type EventModeratorPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type EventStatus = "scheduled" | "ongoing" | "finished";

type AthleteSummary = {
  bib: string;
  name: string;
  affiliation: string;
  yellowCards: number;
  redCards: number;
  yellowDetails?: YellowCardDetail[];
};

type JudgeSummary = {
  id: string;
  name: string;
  position: string;
  zone: string;
};

type ActivityLogItem = {
  id: string;
  time: string;
  actor: string;
  role: "judge" | "moderator";
  action: string;
  targetAthlete?: string;
};

const MOCK_EVENT_STATUS: Record<
  string,
  {
    name: string;
    status: EventStatus;
  }
> = {
  "evt-001": {
    name: "Racewalk Championship 2025",
    status: "ongoing",
  },
  "evt-002": {
    name: "Bangkok City Racewalk",
    status: "finished",
  },
  "evt-003": {
    name: "Thailand National Race Walk Championship",
    status: "scheduled",
  },
};

// TODO: ภายหลังจะใช้ eventId ไปดึงข้อมูลจริงจากฐานข้อมูล / realtime service
const MOCK_ATHLETES: AthleteSummary[] = [
  {
    bib: "101",
    name: "สมชาย ใจดี",
    affiliation: "Bangkok RC",
    yellowCards: 2,
    redCards: 0,
    yellowDetails: [{ symbol: "~" }, { symbol: ">" }],
  },
  {
    bib: "102",
    name: "วิภา เดินไว",
    affiliation: "Chiang Mai Walkers",
    yellowCards: 0,
    redCards: 0,
    yellowDetails: [],
  },
  {
    bib: "103",
    name: "John Runner",
    affiliation: "Phuket Club",
    yellowCards: 3,
    redCards: 1,
    yellowDetails: [{ symbol: ">" }, { symbol: "-" }, { symbol: "-" }],
  },
  {
    bib: "104",
    name: "Sarah Williams",
    affiliation: "London Athletics",
    yellowCards: 6,
    redCards: 2,
    yellowDetails: [
      { symbol: "~" },
      { symbol: ">" },
      { symbol: "-" },
      { symbol: "~" },
      { symbol: "-" },
      { symbol: "-" },
    ],
  },
  {
    bib: "105",
    name: "ณัฐพล วิ่งเร็ว",
    affiliation: "Pattaya Speed Club",
    yellowCards: 4,
    redCards: 0,
    yellowDetails: [{ symbol: ">" }, { symbol: ">" }, { symbol: "~" }, { symbol: ">" }],
  },
];

const MOCK_JUDGES: JudgeSummary[] = [
  {
    id: "J-01",
    name: "Coach A",
    position: "โค้งที่ 1",
    zone: "Zone A",
  },
  {
    id: "J-02",
    name: "Coach B",
    position: "ทางตรงฝั่งสแตนด์",
    zone: "Zone B",
  },
  {
    id: "J-03",
    name: "Coach C",
    position: "จุดเข้าเส้นชัย",
    zone: "Finish",
  },
];

const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "log-001",
    time: "10:15:32",
    actor: "Coach A",
    role: "judge",
    action: "ให้ใบเหลือง",
    targetAthlete: "bib 101 – สมชาย ใจดี",
  },
  {
    id: "log-002",
    time: "10:18:47",
    actor: "Coach B",
    role: "judge",
    action: "ให้ใบเหลือง",
    targetAthlete: "bib 103 – John Runner",
  },
  {
    id: "log-003",
    time: "10:25:09",
    actor: "Moderator",
    role: "moderator",
    action: "ยืนยันใบแดงจาก Judge ที่ Zone B",
    targetAthlete: "bib 103 – John Runner",
  },
];

export default async function EventModeratorPage(
  props: EventModeratorPageProps,
) {
  const { eventId } = await props.params;
  const eventInfo = MOCK_EVENT_STATUS[eventId];

  const statusLabel: Record<EventStatus, string> = {
    scheduled: "ยังไม่เริ่ม",
    ongoing: "กำลังแข่งขัน",
    finished: "จบการแข่งขันแล้ว",
  };

  const statusClassName: Record<EventStatus, string> = {
    scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
    ongoing: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    finished: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Event moderator dashboard
              </h1>
              {eventInfo && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName[eventInfo.status]}`}
                >
                  ● {statusLabel[eventInfo.status]}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              ดูสถานะการแข่งขันแบบ real-time สำหรับ Event:{" "}
              <span className="font-mono text-xs text-slate-700">
                {eventId}
              </span>
              {eventInfo?.name ? (
                <>
                  {" "}
                  – <span className="font-medium">{eventInfo.name}</span>
                </>
              ) : null}
            </p>
          </div>

          <Link href={`/admin/events/${eventId}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้า Event
            </Button>
          </Link>
        </div>

        {/* Athletes & judges overview */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Athletes summary */}
          <Card className="lg:col-span-2 rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    นักกีฬาใน Event นี้
                  </h2>
                  <p className="text-xs text-slate-500">
                    ดูจำนวนใบเหลือง/ใบแดงที่แต่ละคนได้รับ
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Bib</th>
          <th className="px-3 py-2 text-left">ชื่อ</th>
          <th className="px-3 py-2 text-left">สังกัด</th>
          <th className="px-3 py-2 text-center">ใบเหลือง / ใบแดง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {MOCK_ATHLETES.map((athlete) => (
                      <tr key={athlete.bib} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {athlete.bib}
                        </td>
                        <td className="px-3 py-2 text-slate-800">
                          {athlete.name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {athlete.affiliation}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="inline-flex items-center gap-2">
                            <JudgeCardMatrix
                              yellow={athlete.yellowCards}
                              red={athlete.redCards}
                              yellowDetails={athlete.yellowDetails}
                            />
                            <span className="text-[10px] text-slate-500">
                              <span className="font-medium text-amber-700">
                                Y{" "}
                                {Math.min(athlete.yellowCards, MAX_YELLOW)}
                              </span>
                              {" / "}
                              <span className="font-medium text-red-700">
                                R {Math.min(athlete.redCards, MAX_RED)}
                              </span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Judges summary */}
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="space-y-3 p-4 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    รายชื่อกรรมการ
                  </h2>
                  <p className="text-xs text-slate-500">
                    ใครนั่งอยู่ตรงไหน / โซนใดในสนาม
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {MOCK_JUDGES.length} คน
                </span>
              </div>

              <div className="space-y-2">
                {MOCK_JUDGES.map((judge) => (
                  <div
                    key={judge.id}
                    className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {judge.name}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {judge.position}
                      </p>
                    </div>
                    <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      {judge.zone}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500">
                * ตำแหน่งและโซนของกรรมการจะมาจากการตั้งค่าในหน้า Event
                หรือจากระบบจัดการกรรมการในอนาคต
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity log */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Event activity log
                </h2>
                <p className="text-xs text-slate-500">
                  บันทึกว่าใครทำอะไร เวลาไหน และเกี่ยวข้องกับนักกีฬาคนใด
                </p>
              </div>
            </div>

            <div className="max-h-[360px] overflow-auto">
              <ul className="divide-y divide-slate-200 bg-white text-xs text-slate-700">
                {MOCK_ACTIVITY_LOGS.map((log) => (
                  <li key={log.id} className="flex gap-3 px-4 py-2.5">
                    <div className="mt-0.5 w-16 shrink-0 text-[11px] font-mono text-slate-500">
                      {log.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {log.actor}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            log.role === "judge"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {log.role === "judge" ? "Judge" : "Moderator"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        {log.action}
                        {log.targetAthlete ? (
                          <>
                            {" "}
                            –{" "}
                            <span className="font-medium">
                              {log.targetAthlete}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500">
              * ข้อมูล activity log ตอนนี้เป็นตัวอย่างจำลอง – ในอนาคตจะดึงจาก
              ระบบบันทึกเหตุการณ์จริง (real-time event stream) ของกรรมการและ
              moderator
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

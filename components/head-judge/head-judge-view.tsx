"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { confirmRedCard, rejectRedCard } from "@/app/actions/cards";
import { logoutOfficial } from "@/app/actions/officials";
import { RoundActivityLogLine } from "@/components/common/round-activity-log-line";

export type PendingCard = {
  id: string;
  athleteId: string;
  athleteName: string;
  bib: string;
  symbol: "~" | ">";
  symbolLabel: string;
  judgeName: string;
  zone: string;
  time: string;
};

export type AthleteRow = {
  bib: string;
  athleteId: string;
  name: string;
  affiliation: string;
  yellowCards: number;
  confirmedRed: number;
  pendingRed: number;
  status: "OK" | "DQ" | "DNF";
};

export type LogItem = {
  id: string;
  time: string;
  actor: string;
  actorRole: string;
  actionType: string;
  targetBib?: string;
  targetAthlete?: string;
  details?: string;
  lapNumber?: number;
};

type HeadJudgeViewProps = {
  eventId: string;
  judgeName: string;
  eventName: string;
  roundName: string;
  pendingCards: PendingCard[];
  athletes: AthleteRow[];
  logs: LogItem[];
};

export function HeadJudgeView({
  eventId,
  judgeName,
  eventName,
  roundName,
  pendingCards,
  athletes,
  logs,
}: Readonly<HeadJudgeViewProps>) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [actingId, setActingId] = React.useState<string | null>(null);

  // Keep the acting card's buttons disabled for the whole transition (including
  // the router.refresh round-trip) so a fast double-click can't fire a second
  // confirm/reject on a card that's already been decided. The server actions are
  // also idempotent (atomic PENDING→… transition) as a backstop.
  React.useEffect(() => {
    if (!isPending) setActingId(null);
  }, [isPending]);

  const handleConfirm = (cardId: string) => {
    if (isPending && actingId === cardId) return;
    setActingId(cardId);
    startTransition(async () => {
      try {
        const res = await confirmRedCard(cardId);
        toast.success(res?.alreadyDecided ? "ใบแดงนี้ถูกตัดสินไปแล้ว" : "ยืนยันใบแดงแล้ว");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleReject = (cardId: string) => {
    if (isPending && actingId === cardId) return;
    setActingId(cardId);
    startTransition(async () => {
      try {
        const res = await rejectRedCard(cardId);
        toast.success(res?.alreadyDecided ? "ใบแดงนี้ถูกตัดสินไปแล้ว" : "ยกเลิกใบแดงแล้ว");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutOfficial();
      router.push(`/head-judge/events/${eventId}/join`);
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:py-8">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
              หน้าหัวหน้ากรรมการ
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              กิจกรรม: <span className="font-semibold text-slate-100">{eventName}</span> – {roundName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200">
              <span className="text-slate-400">หัวหน้ากรรมการ: </span>
              <span className="font-medium text-slate-100">{judgeName}</span>
            </div>
            <Link
              href={`/events/${eventId}`}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              เปิดหน้า Live
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

        {/* Pending red cards */}
        <Card className="rounded-2xl border-red-900/50 bg-slate-900">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">ใบแดงรอยืนยัน</h2>
                <p className="text-xs text-slate-400">กรรมการในสนามขออนุมัติใบแดง — กดยืนยันหรือยกเลิก</p>
              </div>
              <span className="rounded-full bg-red-950 px-2.5 py-0.5 text-xs font-semibold text-red-300 ring-1 ring-red-900">
                {pendingCards.length} ใบรอ
              </span>
            </div>
            <div className="divide-y divide-slate-800">
              {pendingCards.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-slate-500">
                  ไม่มีใบแดงรอการยืนยัน
                </p>
              ) : (
                pendingCards.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">
                        {p.symbol}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          Bib {p.bib} – {p.athleteName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.symbolLabel} • โดย {p.judgeName}
                          {p.zone && ` (${p.zone})`} • {p.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending && actingId === p.id}
                        onClick={() => handleReject(p.id)}
                        className="h-8 rounded-lg border-slate-600 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending && actingId === p.id}
                        onClick={() => handleConfirm(p.id)}
                        className="h-8 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        ยืนยัน
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Athletes summary */}
        <Card className="rounded-2xl border-slate-800 bg-slate-900">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-100">นักกีฬาในรอบนี้</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                {athletes.length} คน
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs text-slate-200">
                <thead className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-medium uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Bib</th>
                    <th className="px-4 py-3 text-left">นักกีฬา</th>
                    <th className="px-4 py-3 text-left">สังกัด</th>
                    <th className="px-4 py-3 text-center text-amber-400">Y</th>
                    <th className="px-4 py-3 text-center text-red-400">R (ยืนยัน)</th>
                    <th className="px-4 py-3 text-center text-orange-300">R (รอ)</th>
                    <th className="px-4 py-3 text-left">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {athletes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        ไม่มีนักกีฬาในรอบนี้
                      </td>
                    </tr>
                  ) : (
                    athletes.map((a) => (
                      <tr key={a.bib} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono font-semibold text-amber-400">{a.bib}</td>
                        <td className="px-4 py-3">{a.name}</td>
                        <td className="px-4 py-3 text-slate-400">{a.affiliation || "-"}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-300">
                          {a.yellowCards}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-red-300">
                          {a.confirmedRed}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-orange-300">
                          {a.pendingRed}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                              a.status === "DQ"
                                ? "bg-red-950 text-red-300 ring-red-800"
                                : "bg-emerald-950 text-emerald-300 ring-emerald-800"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activity log */}
        <Card className="rounded-2xl border-slate-800 bg-slate-900">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-100">บันทึกกิจกรรม</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                {logs.length} รายการ
              </span>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {logs.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-slate-500">
                  ยังไม่มีกิจกรรมในรอบนี้
                </p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {logs.map((log) => (
                    <li key={log.id} className="flex gap-4 px-6 py-3 hover:bg-slate-800/30">
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                        {log.time}
                      </span>
                      <RoundActivityLogLine
                        theme="dark"
                        actorName={log.actor}
                        log={{
                          actionType: log.actionType,
                          actorName: log.actor,
                          actorRole: log.actorRole,
                          targetBib: log.targetBib,
                          targetAthleteName: log.targetAthlete,
                          details: log.details,
                          lapNumber: log.lapNumber,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

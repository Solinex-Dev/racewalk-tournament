"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Gavel } from "lucide-react";

export type Round = {
  id: string;
  name: string;
  start_time?: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
  athlete_count: number;
  judge_count: number;
};

type RoundsListProps = {
  eventId: string;
  rounds: Round[];
  /** When the parent event is FINISHED, creating more rounds is disallowed. */
  eventFinished?: boolean;
};

const STATUS_LABEL: Record<Round["status"], string> = {
  draft: "ร่าง",
  scheduled: "กำหนดการ",
  ongoing: "กำลังดำเนินการ",
  finished: "เสร็จสิ้น",
};

const STATUS_COLOR: Record<Round["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  finished: "bg-slate-200 text-slate-600",
};

export function RoundsList({ eventId, rounds, eventFinished = false }: Readonly<RoundsListProps>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">รอบแข่ง</h2>
          <p className="mt-1 text-sm text-slate-600">
            จัดการรอบแข่งในกิจกรรมนี้ แต่ละรอบสามารถมีนักกีฬาและกรรมการของตัวเอง
          </p>
        </div>
        {eventFinished ? (
          <span className="text-xs font-medium text-slate-500">
            กิจกรรมจบการแข่งขันแล้ว — เพิ่มรอบไม่ได้
          </span>
        ) : (
          <Link href={`/admin/events/${eventId}/rounds/new`}>
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              <Plus className="mr-2 h-4 w-4" />
              สร้างรอบแข่งใหม่
            </Button>
          </Link>
        )}
      </div>

      {rounds.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              ยังไม่มีรอบแข่ง
            </h3>
            <p className="mb-4 text-xs text-slate-600">
              สร้างรอบแข่งใหม่เพื่อเพิ่มนักกีฬาและกรรมการ
            </p>
            {!eventFinished && (
              <Link href={`/admin/events/${eventId}/rounds/new`}>
                <Button className="rounded-lg px-4 py-2 text-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  สร้างรอบแข่งแรก
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rounds.map((round) => (
            <Card
              key={round.id}
              className="rounded-2xl border-slate-200 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-base font-semibold text-slate-900">
                      {round.name}
                    </h3>
                    {round.start_time && (
                      <p className="text-xs text-slate-500">
                        เวลาเริ่ม: {round.start_time}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[round.status]}`}
                  >
                    {STATUS_LABEL[round.status]}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Users className="h-3.5 w-3.5" />
                    <span>นักกีฬา: {round.athlete_count} คน</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Gavel className="h-3.5 w-3.5" />
                    <span>กรรมการ: {round.judge_count} คน</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/events/${eventId}/rounds/${round.id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg border-slate-200 text-xs"
                    >
                      จัดการ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  moderatorDeleteCard,
  moderatorOverrideAthleteStatus,
  moderatorEditLapTime,
  moderatorDeleteLapTime,
  moderatorEditFinishTime,
  moderatorDeleteFinishTime,
} from "@/app/actions/moderator";
import {
  ModeratorEditDialog,
  type ModeratorEditDialogPayload,
} from "@/components/moderator/moderator-edit-dialog";

import type {
  EditAthlete,
  EditCard,
  EditFinish,
  EditLap,
  EditRoundOption,
} from "./moderator-edit-types";

export type {
  EditRoundOption,
  EditAthlete,
  EditCard,
  EditLap,
  EditFinish,
} from "./moderator-edit-types";

export type ModeratorEditViewProps = {
  eventId: string;
  eventName: string;
  rounds: EditRoundOption[];
  selectedRoundId: string;
  athletes: EditAthlete[];
  cards: EditCard[];
  laps: EditLap[];
  finishes: EditFinish[];
};

function formatMs(ms: number): string {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseTimeString(str: string): number | null {
  // Accept HH:MM:SS or MM:SS or seconds
  const parts = str.trim().split(":").map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 1) return parts[0]! * 1000;
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000;
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000;
  return null;
}

export function ModeratorEditView(props: ModeratorEditViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [dialogPayload, setDialogPayload] =
    React.useState<ModeratorEditDialogPayload | null>(null);
  const dialogOpen = dialogPayload !== null;

  const openDialog = (payload: ModeratorEditDialogPayload) => {
    setDialogPayload(payload);
  };

  const closeDialog = () => setDialogPayload(null);

  const handleDialogConfirm = ({
    reason,
    timeInput,
  }: {
    reason: string;
    timeInput?: string;
  }) => {
    if (!dialogPayload) return;

    const run = (action: () => Promise<unknown>, successMessage: string) => {
      startTransition(async () => {
        try {
          await action();
          toast.success(successMessage);
          closeDialog();
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        }
      });
    };

    switch (dialogPayload.kind) {
      case "status":
        run(
          () =>
            moderatorOverrideAthleteStatus(
              props.selectedRoundId,
              dialogPayload.athlete.id,
              dialogPayload.newStatus,
              reason,
            ),
          `เปลี่ยนสถานะเป็น ${dialogPayload.newStatus} แล้ว`,
        );
        break;
      case "delete-card":
        run(
          () => moderatorDeleteCard(dialogPayload.card.id, reason),
          "ลบใบเรียบร้อย",
        );
        break;
      case "delete-lap":
        run(
          () => moderatorDeleteLapTime(dialogPayload.lap.id, reason),
          "ลบ Lap เรียบร้อย",
        );
        break;
      case "delete-finish":
        run(
          () => moderatorDeleteFinishTime(dialogPayload.finish.id, reason),
          "ลบเวลาเรียบร้อย",
        );
        break;
      case "edit-lap": {
        const newMs = parseTimeString(timeInput ?? "");
        if (newMs === null) {
          toast.error("รูปแบบเวลาไม่ถูกต้อง");
          return;
        }
        run(
          () => moderatorEditLapTime(dialogPayload.lap.id, newMs, reason),
          "แก้ไข Lap เรียบร้อย",
        );
        break;
      }
      case "edit-finish": {
        const newMs = parseTimeString(timeInput ?? "");
        if (newMs === null) {
          toast.error("รูปแบบเวลาไม่ถูกต้อง");
          return;
        }
        run(
          () => moderatorEditFinishTime(dialogPayload.finish.id, newMs, reason),
          "แก้ไขเวลาเรียบร้อย",
        );
        break;
      }
    }
  };

  const handleDeleteCard = (card: EditCard) => {
    openDialog({ kind: "delete-card", card });
  };

  const handleStatusChange = (athlete: EditAthlete, newStatus: "OK" | "DQ" | "DNF") => {
    if (athlete.status === newStatus) return;
    openDialog({ kind: "status", athlete, newStatus });
  };

  const handleEditLap = (lap: EditLap) => {
    openDialog({ kind: "edit-lap", lap });
  };

  const handleDeleteLap = (lap: EditLap) => {
    openDialog({ kind: "delete-lap", lap });
  };

  const handleEditFinish = (ft: EditFinish) => {
    openDialog({ kind: "edit-finish", finish: ft });
  };

  const handleDeleteFinish = (ft: EditFinish) => {
    openDialog({ kind: "delete-finish", finish: ft });
  };

  return (
    <>
      <ModeratorEditDialog
        payload={dialogPayload}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onConfirm={handleDialogConfirm}
        isPending={isPending}
        formatMs={formatMs}
      />

    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Moderator Edit — Correction Mode
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              แก้ไข/ลบข้อมูลที่เคยบันทึกไปแล้ว — ทุกการเปลี่ยนแปลงถูกบันทึกใน audit log
            </p>
            <p className="text-xs text-slate-500">{props.eventName}</p>
          </div>
          <Link href={`/admin/events/${props.eventId}/moderator`}>
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไป Moderator view
            </Button>
          </Link>
        </div>

        {/* Round selector */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">เลือกรอบ:</span>
              {props.rounds.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/events/${props.eventId}/moderator/edit?round=${r.id}`}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                    r.id === props.selectedRoundId
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {r.name} • {r.status}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Athletes status */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">สถานะนักกีฬา ({props.athletes.length} คน)</h2>
              <p className="text-xs text-slate-500">คลิกสถานะเพื่อ override</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Bib</th>
                    <th className="px-4 py-2 text-left">นักกีฬา</th>
                    <th className="px-4 py-2 text-left">สถานะปัจจุบัน</th>
                    <th className="px-4 py-2 text-left">เปลี่ยนเป็น</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {props.athletes.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-mono font-semibold">{a.bib}</td>
                      <td className="px-4 py-2">{a.name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            a.status === "DQ"
                              ? "bg-red-100 text-red-700"
                              : a.status === "DNF"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          {(["OK", "DQ", "DNF"] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={isPending || a.status === s}
                              onClick={() => handleStatusChange(a, s)}
                              className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                a.status === s
                                  ? "border-slate-300 bg-slate-100 text-slate-400"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">ใบเหลือง/แดง ที่ออกในรอบนี้ ({props.cards.length})</h2>
              <p className="text-xs text-slate-500">ลบใบที่ออกผิด — ถ้าเป็นใบแดงยืนยันที่ทำให้ DQ ระบบจะปลด DQ ให้อัตโนมัติ</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">เวลา</th>
                    <th className="px-4 py-2 text-left">นักกีฬา</th>
                    <th className="px-4 py-2 text-left">จากกรรมการ</th>
                    <th className="px-4 py-2 text-left">ประเภท</th>
                    <th className="px-4 py-2 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {props.cards.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                        ไม่มีใบในรอบนี้
                      </td>
                    </tr>
                  ) : (
                    props.cards.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-mono text-[11px] text-slate-600">
                          {new Date(c.issuedAt).toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-2">
                          <span className="font-mono">{c.bib}</span> · {c.athleteName}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{c.judgeName}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              c.color === "YELLOW"
                                ? "bg-amber-100 text-amber-700"
                                : c.state === "CONFIRMED"
                                  ? "bg-red-100 text-red-700"
                                  : c.state === "OVERRIDDEN"
                                    ? "bg-slate-200 text-slate-500 line-through"
                                    : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {c.color === "YELLOW"
                              ? "เหลือง"
                              : c.state === "PENDING"
                                ? "แดง รอ"
                                : c.state === "CONFIRMED"
                                  ? "แดง ✓"
                                  : "แดง ยกเลิก"}
                            {" • "}
                            {c.symbol === "BENT_KNEE" ? "เข่างอ" : "ยกเท้า"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDeleteCard(c)}
                            className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                          >
                            ลบใบ
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Lap times */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">เวลา Lap ({props.laps.length} รายการ)</h2>
              <p className="text-xs text-slate-500">แก้ไขหรือลบ lap time ที่บันทึกผิด</p>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Bib</th>
                    <th className="px-4 py-2 text-left">นักกีฬา</th>
                    <th className="px-4 py-2 text-center">Lap</th>
                    <th className="px-4 py-2 text-center">เวลา (HH:MM:SS)</th>
                    <th className="px-4 py-2 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {props.laps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                        ไม่มี Lap time ในรอบนี้
                      </td>
                    </tr>
                  ) : (
                    props.laps.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-mono">{l.bib}</td>
                        <td className="px-4 py-2">{l.athleteName}</td>
                        <td className="px-4 py-2 text-center font-mono">{l.lapNumber}</td>
                        <td className="px-4 py-2 text-center font-mono">{formatMs(l.timeMs)}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleEditLap(l)}
                              className="h-7 rounded-lg px-2 text-[11px]"
                            >
                              แก้ไข
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleDeleteLap(l)}
                              className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                            >
                              ลบ
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Finish times */}
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">เวลาเข้าเส้นชัย ({props.finishes.length} รายการ)</h2>
              <p className="text-xs text-slate-500">ถ้าลบจะคืนสภาพให้ Timekeeper บันทึกใหม่ได้</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">อันดับ</th>
                    <th className="px-4 py-2 text-left">Bib</th>
                    <th className="px-4 py-2 text-left">นักกีฬา</th>
                    <th className="px-4 py-2 text-center">เวลา</th>
                    <th className="px-4 py-2 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {props.finishes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                        ยังไม่มีเวลาเข้าเส้นชัย
                      </td>
                    </tr>
                  ) : (
                    props.finishes.map((ft) => (
                      <tr key={ft.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold">{ft.position}</td>
                        <td className="px-4 py-2 font-mono">{ft.bib}</td>
                        <td className="px-4 py-2">{ft.athleteName}</td>
                        <td className="px-4 py-2 text-center font-mono">{formatMs(ft.timeMs)}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleEditFinish(ft)}
                              className="h-7 rounded-lg px-2 text-[11px]"
                            >
                              แก้ไข
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleDeleteFinish(ft)}
                              className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                            >
                              ลบ
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
    </>
  );
}

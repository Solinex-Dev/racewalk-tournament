"use client";

import * as React from "react";
import { AlertTriangle, Ban, CircleCheck, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EditAthlete, EditCard, EditFinish, EditLap } from "./moderator-edit-types";

export type ModeratorEditDialogPayload =
  | { kind: "status"; athlete: EditAthlete; newStatus: "OK" | "DQ" | "DNF" }
  | { kind: "delete-card"; card: EditCard }
  | { kind: "delete-lap"; lap: EditLap }
  | { kind: "delete-finish"; finish: EditFinish }
  | { kind: "edit-lap"; lap: EditLap }
  | { kind: "edit-finish"; finish: EditFinish };

type ModeratorEditDialogProps = {
  payload: ModeratorEditDialogPayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { reason: string; timeInput?: string }) => void;
  isPending?: boolean;
  formatMs: (ms: number) => string;
};

const STATUS_UI = {
  DQ: {
    title: "ยืนยันเปลี่ยนสถานะเป็น DQ",
    hint: "นักกีฬาจะถูกตัดสิทธิ์ (Disqualify) จากการแข่งขันในรอบนี้",
    badge: "DQ",
    badgeClass: "bg-red-100 text-red-800 ring-red-200",
    iconWrap: "bg-red-50 text-red-600",
    Icon: Ban,
    confirmLabel: "ยืนยัน DQ",
    confirmClass: "bg-red-600 text-white hover:bg-red-700",
  },
  DNF: {
    title: "ยืนยันเปลี่ยนสถานะเป็น DNF",
    hint: "บันทึกว่านักกีฬาไม่จบการแข่งขัน (Did Not Finish) ในรอบนี้",
    badge: "DNF",
    badgeClass: "bg-amber-100 text-amber-800 ring-amber-200",
    iconWrap: "bg-amber-50 text-amber-600",
    Icon: Flag,
    confirmLabel: "ยืนยัน DNF",
    confirmClass: "bg-amber-600 text-white hover:bg-amber-700",
  },
  OK: {
    title: "ยืนยันเปลี่ยนสถานะเป็น OK",
    hint: "คืนสถานะนักกีฬาเป็นปกติ — ใช้เมื่อแก้ไขสถานะที่ตั้งผิด",
    badge: "OK",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    iconWrap: "bg-emerald-50 text-emerald-600",
    Icon: CircleCheck,
    confirmLabel: "ยืนยัน OK",
    confirmClass: "bg-slate-900 text-white hover:bg-slate-800",
  },
} as const;

function getDialogMeta(
  payload: ModeratorEditDialogPayload,
  formatMs: (ms: number) => string,
) {
  switch (payload.kind) {
    case "status": {
      const ui = STATUS_UI[payload.newStatus];
      return {
        title: ui.title,
        description: (
          <>
            <span className="font-medium text-slate-900">{payload.athlete.name}</span>
            <span className="text-slate-500"> (Bib {payload.athlete.bib})</span>
            {" — "}
            {ui.hint}
          </>
        ),
        variant: payload.newStatus,
        confirmLabel: ui.confirmLabel,
        confirmClass: ui.confirmClass,
        destructive: payload.newStatus !== "OK",
        showTime: false,
        timeDefault: "",
        timeLabel: "",
      };
    }
    case "delete-card": {
      const colorLabel = payload.card.color === "YELLOW" ? "ใบเหลือง" : "ใบแดง";
      return {
        title: `ลบ${colorLabel}`,
        description: (
          <>
            ลบ{colorLabel}ของ{" "}
            <span className="font-medium text-slate-900">{payload.card.athleteName}</span>
            {payload.card.color === "RED" && (
              <span className="mt-1 block text-amber-700">
                ถ้าเป็นใบแดงที่ยืนยันแล้วและทำให้ DQ ระบบจะปลด DQ ให้อัตโนมัติ
              </span>
            )}
          </>
        ),
        variant: "destructive" as const,
        confirmLabel: "ลบใบ",
        confirmClass: "bg-red-600 text-white hover:bg-red-700",
        destructive: true,
        showTime: false,
        timeDefault: "",
        timeLabel: "",
      };
    }
    case "delete-lap":
      return {
        title: "ลบ Lap time",
        description: (
          <>
            ลบ Lap {payload.lap.lapNumber} ของ{" "}
            <span className="font-medium text-slate-900">{payload.lap.athleteName}</span>
          </>
        ),
        variant: "destructive" as const,
        confirmLabel: "ลบ Lap",
        confirmClass: "bg-red-600 text-white hover:bg-red-700",
        destructive: true,
        showTime: false,
        timeDefault: "",
        timeLabel: "",
      };
    case "delete-finish":
      return {
        title: "ลบเวลาเข้าเส้นชัย",
        description: (
          <>
            ลบเวลาเข้าเส้นชัยของ{" "}
            <span className="font-medium text-slate-900">{payload.finish.athleteName}</span>
            <span className="mt-1 block text-slate-500">
              ผู้เก็บ Lap Time สามารถบันทึกเวลาใหม่ได้หลังลบ
            </span>
          </>
        ),
        variant: "destructive" as const,
        confirmLabel: "ลบเวลา",
        confirmClass: "bg-red-600 text-white hover:bg-red-700",
        destructive: true,
        showTime: false,
        timeDefault: "",
        timeLabel: "",
      };
    case "edit-lap":
      return {
        title: `แก้ไข Lap ${payload.lap.lapNumber}`,
        description: (
          <>
            นักกีฬา{" "}
            <span className="font-medium text-slate-900">{payload.lap.athleteName}</span>
            {" "}
            (Bib {payload.lap.bib})
          </>
        ),
        variant: "default" as const,
        confirmLabel: "บันทึกเวลา",
        confirmClass: "bg-slate-900 text-white hover:bg-slate-800",
        destructive: false,
        showTime: true,
        timeDefault: formatMs(payload.lap.timeMs),
        timeLabel: "เวลาใหม่ (HH:MM:SS หรือ MM:SS)",
      };
    case "edit-finish":
      return {
        title: "แก้ไขเวลาเข้าเส้นชัย",
        description: (
          <>
            นักกีฬา{" "}
            <span className="font-medium text-slate-900">{payload.finish.athleteName}</span>
            {" "}
            (Bib {payload.finish.bib})
          </>
        ),
        variant: "default" as const,
        confirmLabel: "บันทึกเวลา",
        confirmClass: "bg-slate-900 text-white hover:bg-slate-800",
        destructive: false,
        showTime: true,
        timeDefault: formatMs(payload.finish.timeMs),
        timeLabel: "เวลาใหม่ (HH:MM:SS)",
      };
  }
}

export function ModeratorEditDialog({
  payload,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  formatMs,
}: ModeratorEditDialogProps) {
  const [reason, setReason] = React.useState("");
  const [timeInput, setTimeInput] = React.useState("");

  React.useEffect(() => {
    if (!open || !payload) return;
    setReason("");
    if (payload.kind === "edit-lap") {
      setTimeInput(formatMs(payload.lap.timeMs));
    } else if (payload.kind === "edit-finish") {
      setTimeInput(formatMs(payload.finish.timeMs));
    } else {
      setTimeInput("");
    }
  }, [open, payload, formatMs]);

  if (!payload) return null;

  const meta = getDialogMeta(payload, formatMs);
  const statusUi =
    payload.kind === "status" ? STATUS_UI[payload.newStatus] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm({ reason: trimmed, timeInput: meta.showTime ? timeInput : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-3">
            {statusUi ? (
              <div className="flex items-start gap-3 pr-6">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    statusUi.iconWrap,
                  )}
                >
                  <statusUi.Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle className="text-left text-slate-900">
                    {meta.title}
                  </DialogTitle>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                      statusUi.badgeClass,
                    )}
                  >
                    {statusUi.badge}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 pr-6">
                {meta.destructive && (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertTriangle className="size-5" aria-hidden />
                  </div>
                )}
                <DialogTitle
                  className={cn(
                    "text-left text-slate-900",
                    !meta.destructive && "pr-0",
                  )}
                >
                  {meta.title}
                </DialogTitle>
              </div>
            )}
            <DialogDescription asChild>
              <p className="text-left text-sm leading-relaxed text-slate-600">
                {meta.description}
              </p>
            </DialogDescription>
            {payload.kind === "status" && (
              <p className="text-left text-xs text-slate-500">
                สถานะปัจจุบัน:{" "}
                <span className="font-medium text-slate-700">{payload.athlete.status}</span>
                {" → "}
                <span className="font-medium text-slate-900">{payload.newStatus}</span>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {meta.showTime && (
              <div className="space-y-2">
                <label
                  htmlFor="moderator-edit-time"
                  className="text-sm font-medium text-slate-900"
                >
                  {meta.timeLabel}
                </label>
                <Input
                  id="moderator-edit-time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="rounded-xl font-mono"
                  placeholder="00:05:30"
                  disabled={isPending}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="moderator-edit-reason"
                className="text-sm font-medium text-slate-900"
              >
                เหตุผล <span className="text-red-600">*</span>
              </label>
              <textarea
                id="moderator-edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="ระบุเหตุผล — จะถูกบันทึกใน activity log"
                disabled={isPending}
                required
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-xl border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">
                ทุกการเปลี่ยนแปลงในโหมดแก้ไขจะถูกบันทึกใน audit log
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isPending || !reason.trim() || (meta.showTime && !timeInput.trim())}
              className={cn("rounded-xl", meta.confirmClass)}
            >
              {isPending ? "กำลังบันทึก…" : meta.confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

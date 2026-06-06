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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import {
  DQ_REASONS,
  DQ_REASON_OTHER,
  DQ_CATEGORY_LABEL,
  dqReasonLabel,
} from "@/lib/dq-reasons";
import type { EditAthlete, EditCard, EditFinish, EditLap } from "./moderator-edit-types";

// Searchable reason list for a post-race DQ: catalog rule codes first, then a
// pinned "อื่น ๆ" (Other) entry that switches the field to free text.
const DQ_REASON_OPTIONS: ComboboxOption[] = [
  ...DQ_REASONS.map((r) => ({
    value: r.code,
    label: `${r.code} — ${r.th}`,
    keywords: [r.code, r.th, r.en, DQ_CATEGORY_LABEL[r.category]],
  })),
  {
    value: DQ_REASON_OTHER,
    label: "อื่น ๆ (ระบุเหตุผลเอง)",
    keywords: ["other", "อื่นๆ", "อื่น ๆ", "ระบุเอง", "free text"],
  },
];

export type ModeratorEditDialogPayload =
  | { kind: "status"; athlete: EditAthlete; newStatus: "OK" | "DQ" | "DNF" }
  | { kind: "delete-card"; card: EditCard }
  | { kind: "confirm-red"; card: EditCard }
  | { kind: "reject-red"; card: EditCard }
  | { kind: "delete-lap"; lap: EditLap }
  | { kind: "delete-finish"; finish: EditFinish }
  | { kind: "edit-lap"; lap: EditLap }
  | { kind: "edit-finish"; finish: EditFinish }
  | { kind: "edit-finish-position"; finish: EditFinish }
  | { kind: "edit-card-symbol"; card: EditCard };

type ModeratorEditDialogProps = {
  payload: ModeratorEditDialogPayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    reason: string;
    timeInput?: string;
    symbolValue?: "LIFTED_FOOT" | "BENT_KNEE";
    dqReasonCode?: string | null;
  }) => void;
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
    case "confirm-red":
      return {
        title: "ยืนยันใบแดง (แทนหัวหน้ากรรมการ)",
        description: (
          <>
            ยืนยันใบแดงของ{" "}
            <span className="font-medium text-slate-900">{payload.card.athleteName}</span>{" "}
            (Bib {payload.card.bib}) ที่ออกโดย {payload.card.judgeName}
            <span className="mt-1 block text-amber-700">
              ถ้านักกีฬามีใบแดงที่ยืนยันแล้วครบ 4 ใบ ระบบจะตัดสิทธิ์ (DQ) อัตโนมัติ
            </span>
          </>
        ),
        variant: "default" as const,
        confirmLabel: "ยืนยันใบแดง",
        confirmClass: "bg-emerald-600 text-white hover:bg-emerald-700",
        destructive: false,
        showTime: false,
        timeDefault: "",
        timeLabel: "",
      };
    case "reject-red":
      return {
        title: "ยกเลิกใบแดง (แทนหัวหน้ากรรมการ)",
        description: (
          <>
            ยกเลิก (ปฏิเสธ) ใบแดงของ{" "}
            <span className="font-medium text-slate-900">{payload.card.athleteName}</span>{" "}
            (Bib {payload.card.bib}) ที่ออกโดย {payload.card.judgeName}
            <span className="mt-1 block text-slate-500">
              ใบแดงจะถูกตั้งเป็น “ยกเลิก” และไม่นับรวมในการตัดสิทธิ์
            </span>
          </>
        ),
        variant: "default" as const,
        confirmLabel: "ยกเลิกใบแดง",
        confirmClass: "bg-slate-700 text-white hover:bg-slate-800",
        destructive: false,
        showTime: false,
        timeDefault: "",
        timeLabel: "",
      };
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
    case "edit-finish-position":
      return {
        title: "แก้ไขอันดับ",
        description: (
          <>
            นักกีฬา{" "}
            <span className="font-medium text-slate-900">{payload.finish.athleteName}</span>{" "}
            (Bib {payload.finish.bib})
          </>
        ),
        variant: "default" as const,
        confirmLabel: "บันทึกอันดับ",
        confirmClass: "bg-slate-900 text-white hover:bg-slate-800",
        destructive: false,
        showTime: true,
        timeDefault: String(payload.finish.position),
        timeLabel: "อันดับใหม่ (ตัวเลข)",
      };
    case "edit-card-symbol":
      return {
        title: "แก้ไขสัญลักษณ์ความผิด",
        description: (
          <>
            ใบ{payload.card.color === "YELLOW" ? "เหลือง" : "แดง"}ของ{" "}
            <span className="font-medium text-slate-900">{payload.card.athleteName}</span>{" "}
            (Bib {payload.card.bib}) โดย {payload.card.judgeName}
          </>
        ),
        variant: "default" as const,
        confirmLabel: "บันทึกสัญลักษณ์",
        confirmClass: "bg-slate-900 text-white hover:bg-slate-800",
        destructive: false,
        showTime: false,
        timeDefault: "",
        timeLabel: "",
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
}: Readonly<ModeratorEditDialogProps>) {
  const [reason, setReason] = React.useState("");
  const [timeInput, setTimeInput] = React.useState("");
  const [symbolValue, setSymbolValue] =
    React.useState<"LIFTED_FOOT" | "BENT_KNEE">("LIFTED_FOOT");
  // DQ reason picker: "" = none yet, a catalog code, or DQ_REASON_OTHER.
  const [dqCode, setDqCode] = React.useState("");

  React.useEffect(() => {
    if (!open || !payload) return;
    setReason("");
    if (payload.kind === "edit-lap") {
      setTimeInput(formatMs(payload.lap.timeMs));
    } else if (payload.kind === "edit-finish") {
      setTimeInput(formatMs(payload.finish.timeMs));
    } else if (payload.kind === "edit-finish-position") {
      setTimeInput(String(payload.finish.position));
    } else {
      setTimeInput("");
    }
    if (payload.kind === "edit-card-symbol") {
      setSymbolValue(payload.card.symbol);
    }
    // Preselect any existing DQ code when re-DQing the same athlete.
    if (payload.kind === "status" && payload.newStatus === "DQ") {
      setDqCode(payload.athlete.dqReasonCode ?? "");
    } else {
      setDqCode("");
    }
  }, [open, payload, formatMs]);

  if (!payload) return null;

  const meta = getDialogMeta(payload, formatMs);
  const statusUi =
    payload.kind === "status" ? STATUS_UI[payload.newStatus] : null;

  const isDqStatus = payload.kind === "status" && payload.newStatus === "DQ";
  const isOtherReason = dqCode === DQ_REASON_OTHER;
  const presetReasonSelected = isDqStatus && dqCode !== "" && !isOtherReason;

  // DQ with a preset code needs no free text; "Other" requires it. Everything
  // else keeps the original "reason is required" rule.
  const reasonSatisfied = isDqStatus
    ? presetReasonSelected || (isOtherReason && reason.trim().length > 0)
    : reason.trim().length > 0;
  const canSubmit =
    reasonSatisfied && !(meta.showTime && !timeInput.trim()) && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDqStatus) {
      const note = reason.trim();
      if (presetReasonSelected) {
        onConfirm({
          reason: note ? `${dqReasonLabel(dqCode)} — ${note}` : dqReasonLabel(dqCode),
          dqReasonCode: dqCode,
        });
        return;
      }
      // "Other" → free text is the reason, no stored code.
      if (!note) return;
      onConfirm({ reason: note, dqReasonCode: null });
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm({
      reason: trimmed,
      timeInput: meta.showTime ? timeInput : undefined,
      symbolValue: payload.kind === "edit-card-symbol" ? symbolValue : undefined,
    });
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
                  placeholder={payload.kind === "edit-finish-position" ? "เช่น 3" : "00:05:30"}
                  disabled={isPending}
                  required
                />
              </div>
            )}

            {payload.kind === "edit-card-symbol" && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-900">สัญลักษณ์ความผิด</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["LIFTED_FOOT", "ยกเท้า", "~"],
                      ["BENT_KNEE", "เข่างอ", ">"],
                    ] as const
                  ).map(([val, label, sym]) => (
                    <button
                      key={val}
                      type="button"
                      disabled={isPending}
                      onClick={() => setSymbolValue(val)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        symbolValue === val
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span className="font-mono text-base">{sym}</span> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isDqStatus && (
              <div className="space-y-2">
                <label
                  htmlFor="moderator-dq-reason"
                  className="text-sm font-medium text-slate-900"
                >
                  เหตุผลการตัดสิทธิ์ (รหัสกติกา) <span className="text-red-600">*</span>
                </label>
                <Combobox
                  id="moderator-dq-reason"
                  options={DQ_REASON_OPTIONS}
                  value={dqCode}
                  onChange={setDqCode}
                  disabled={isPending}
                  placeholder="เลือกเหตุผล / รหัสกติกา…"
                  searchPlaceholder="ค้นหารหัส หรือเหตุผล (เช่น TR54, ใบแดง)…"
                  emptyText="ไม่พบรหัสที่ค้นหา"
                />
                <p className="text-xs text-slate-500">
                  รหัสที่เลือกจะแสดงในช่อง DQ ของเอกสาร PDF / Excel / CSV — เลือก
                  “อื่น ๆ” เพื่อระบุเหตุผลเองโดยไม่ใส่รหัส
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="moderator-edit-reason"
                className="text-sm font-medium text-slate-900"
              >
                {isDqStatus && presetReasonSelected ? (
                  "หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                ) : (
                  <>
                    {isDqStatus ? "เหตุผล (ระบุเอง)" : "เหตุผล"}{" "}
                    <span className="text-red-600">*</span>
                  </>
                )}
              </label>
              <textarea
                id="moderator-edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={
                  isDqStatus && presetReasonSelected
                    ? "บันทึกรายละเอียดเพิ่มเติม (ถ้ามี)"
                    : "ระบุเหตุผล — จะถูกบันทึกใน activity log"
                }
                disabled={isPending}
                required={!isDqStatus || isOtherReason}
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
              disabled={!canSubmit}
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

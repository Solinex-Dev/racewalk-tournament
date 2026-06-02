"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditCard, EditJudge } from "./moderator-edit-types";

type CardEditValue = {
  judgeId: string;
  color: "YELLOW" | "RED";
  symbol: "LIFTED_FOOT" | "BENT_KNEE";
  issuedAtMs: number;
  reason: string;
};

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function Toggle({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

export function CardEditDialog({
  card,
  judges,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: {
  card: EditCard | null;
  judges: EditJudge[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CardEditValue) => void;
  isPending?: boolean;
}) {
  const [judgeId, setJudgeId] = React.useState("");
  const [color, setColor] = React.useState<"YELLOW" | "RED">("YELLOW");
  const [symbol, setSymbol] = React.useState<"LIFTED_FOOT" | "BENT_KNEE">("LIFTED_FOOT");
  const [issuedAt, setIssuedAt] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open || !card) return;
    setJudgeId(card.judgeId);
    setColor(card.color);
    setSymbol(card.symbol);
    setIssuedAt(toDatetimeLocal(card.issuedAt));
    setReason("");
  }, [open, card]);

  if (!card) return null;

  // The judge who issued the card may not be in the JUDGE/HEAD_JUDGE list
  // (rare) — make sure the current value is still selectable.
  const judgeOptions = judges.some((j) => j.id === card.judgeId)
    ? judges
    : [{ id: card.judgeId, name: card.judgeName, position: "JUDGE" as const, zone: card.judgeZone }, ...judges];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    const ms = issuedAt ? new Date(issuedAt).getTime() : NaN;
    if (!trimmed || !judgeId || Number.isNaN(ms)) return;
    onConfirm({ judgeId, color, symbol, issuedAtMs: ms, reason: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">แก้ไขใบ</DialogTitle>
            <DialogDescription asChild>
              <p className="text-left text-sm text-slate-600">
                <span className="font-medium text-slate-900">{card.athleteName}</span> (Bib {card.bib})
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">กรรมการผู้ออกใบ</label>
              <select
                value={judgeId}
                onChange={(e) => setJudgeId(e.target.value)}
                disabled={isPending}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900"
              >
                {judgeOptions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                    {j.zone ? ` (${j.zone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">ประเภทใบ</label>
              <div className="flex gap-2">
                <Toggle active={color === "YELLOW"} disabled={isPending} onClick={() => setColor("YELLOW")}>
                  <span className="inline-block h-3 w-2.5 rounded-sm bg-amber-400" /> ใบเหลือง
                </Toggle>
                <Toggle active={color === "RED"} disabled={isPending} onClick={() => setColor("RED")}>
                  <span className="inline-block h-3 w-2.5 rounded-sm bg-red-500" /> ใบแดง
                </Toggle>
              </div>
              {color === "RED" && card.color === "YELLOW" && (
                <p className="text-[11px] text-amber-700">
                  เปลี่ยนเป็นใบแดงจะเริ่มที่สถานะ “รอยืนยัน” (ยืนยันได้ภายหลัง)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">สัญลักษณ์ความผิด</label>
              <div className="flex gap-2">
                <Toggle active={symbol === "LIFTED_FOOT"} disabled={isPending} onClick={() => setSymbol("LIFTED_FOOT")}>
                  <span className="font-mono text-base">~</span> ยกเท้า
                </Toggle>
                <Toggle active={symbol === "BENT_KNEE"} disabled={isPending} onClick={() => setSymbol("BENT_KNEE")}>
                  <span className="font-mono text-base">&gt;</span> เข่างอ
                </Toggle>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="card-edit-time" className="text-sm font-medium text-slate-900">
                เวลาที่ออกใบ
              </label>
              <input
                id="card-edit-time"
                type="datetime-local"
                step="1"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                disabled={isPending}
                required
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 font-mono text-sm text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="card-edit-reason" className="text-sm font-medium text-slate-900">
                เหตุผล <span className="text-red-600">*</span>
              </label>
              <textarea
                id="card-edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
                disabled={isPending}
                placeholder="ระบุเหตุผล — บันทึกใน audit log"
                className="w-full resize-none rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-slate-300 disabled:opacity-50"
              />
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
              disabled={isPending || !reason.trim() || !judgeId}
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              {isPending ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Input } from "@/components/ui/input";
import type { EditRoundInfo } from "./moderator-edit-types";

type RoundInfoValue = {
  name: string;
  distanceKm: string;
  lapCount: number | null;
  startedAtMs: number | null;
  endedAtMs: number | null;
  reason: string;
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function RoundInfoDialog({
  roundInfo,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: {
  roundInfo: EditRoundInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: RoundInfoValue) => void;
  isPending?: boolean;
}) {
  const [name, setName] = React.useState("");
  const [distanceKm, setDistanceKm] = React.useState("");
  const [lapCount, setLapCount] = React.useState("");
  const [startedAt, setStartedAt] = React.useState("");
  const [endedAt, setEndedAt] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open || !roundInfo) return;
    setName(roundInfo.name);
    setDistanceKm(roundInfo.distanceKm);
    setLapCount(roundInfo.lapCount != null ? String(roundInfo.lapCount) : "");
    setStartedAt(toDatetimeLocal(roundInfo.startedAt));
    setEndedAt(toDatetimeLocal(roundInfo.endedAt));
    setReason("");
  }, [open, roundInfo]);

  if (!roundInfo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || !name.trim()) return;
    onConfirm({
      name: name.trim(),
      distanceKm: distanceKm.trim(),
      lapCount: lapCount.trim() ? Math.max(1, Math.floor(Number(lapCount))) : null,
      startedAtMs: startedAt ? new Date(startedAt).getTime() : null,
      endedAtMs: endedAt ? new Date(endedAt).getTime() : null,
      reason: trimmed,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">แก้ไขข้อมูลรอบ</DialogTitle>
            <DialogDescription asChild>
              <p className="text-left text-sm text-slate-600">
                แก้ไขชื่อรอบ ระยะ จำนวน Lap และเวลาเริ่ม/จบจริง — กระทบ “เวลาที่ใช้” ทั้งหมด
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="round-name" className="text-sm font-medium text-slate-900">
                ชื่อรอบ <span className="text-red-600">*</span>
              </label>
              <Input
                id="round-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="round-distance" className="text-sm font-medium text-slate-900">
                  ระยะ (กม.)
                </label>
                <Input
                  id="round-distance"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  disabled={isPending}
                  placeholder="เช่น 20"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="round-laps" className="text-sm font-medium text-slate-900">
                  จำนวน Lap
                </label>
                <Input
                  id="round-laps"
                  type="number"
                  min={1}
                  value={lapCount}
                  onChange={(e) => setLapCount(e.target.value)}
                  disabled={isPending}
                  placeholder="เช่น 20"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-started" className="text-sm font-medium text-slate-900">
                เวลาเริ่มจริง (Start)
              </label>
              <input
                id="round-started"
                type="datetime-local"
                step="1"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                disabled={isPending}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 font-mono text-sm text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-ended" className="text-sm font-medium text-slate-900">
                เวลาจบจริง (End)
              </label>
              <input
                id="round-ended"
                type="datetime-local"
                step="1"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                disabled={isPending}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 font-mono text-sm text-slate-900"
              />
              <p className="text-[11px] text-slate-500">เว้นว่าง = ยังไม่จบ</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-reason" className="text-sm font-medium text-slate-900">
                เหตุผล <span className="text-red-600">*</span>
              </label>
              <textarea
                id="round-reason"
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
              disabled={isPending || !reason.trim() || !name.trim()}
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              {isPending ? "กำลังบันทึก…" : "บันทึกข้อมูลรอบ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

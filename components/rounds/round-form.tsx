"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createRound, updateRound } from "@/app/actions/rounds";

export type AthleteOption = { id: string; name: string };
export type JudgeOption = { id: string; name: string };

type AthleteEntry = { athleteId: string; bib: string };
type OfficialEntry = {
  judgeId: string;
  zone: string;
  secretCode: string;
  position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER";
};

export type RoundFormValues = {
  name: string;
  scheduledTime: string;
  distanceKm: string;
  lapCount: number;
  note: string;
  status: "SCHEDULED" | "ONGOING" | "FINISHED";
  athletes: AthleteEntry[];
  officials: OfficialEntry[];
};

type RoundFormProps = {
  mode: "create" | "edit";
  eventId: string;
  roundId?: string;
  athleteOptions: AthleteOption[];
  judgeOptions: JudgeOption[];
  defaultValues?: Partial<RoundFormValues>;
};

const EMPTY: RoundFormValues = {
  name: "",
  scheduledTime: "",
  distanceKm: "",
  lapCount: 1,
  note: "",
  status: "SCHEDULED",
  athletes: [],
  officials: [],
};

const SECRET_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Per-round official caps — 8 judges + 1 head judge + 1 event logger = 10 max.
const MAX_JUDGES = 8;
const MAX_HEAD_JUDGE = 1;
const MAX_EVENT_LOGGER = 1;

function countChipCls(over: boolean): string {
  return `inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
    over ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-700"
  }`;
}

function generateSecretCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += SECRET_CHARS[Math.floor(Math.random() * SECRET_CHARS.length)] ?? "X";
  }
  return code;
}

const POSITION_LABEL: Record<OfficialEntry["position"], string> = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  EVENT_LOGGER: "เก็บ Lap Time",
};

export function RoundForm({
  mode,
  eventId,
  roundId,
  athleteOptions,
  judgeOptions,
  defaultValues,
}: RoundFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<RoundFormValues>({
    ...EMPTY,
    ...defaultValues,
    officials: (defaultValues?.officials ?? []).map((o) => ({
      ...o,
      secretCode: o.secretCode || generateSecretCode(),
    })),
  });
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [athleteSearch, setAthleteSearch] = React.useState("");
  const [judgeSearch, setJudgeSearch] = React.useState("");
  const [athletePickerOpen, setAthletePickerOpen] = React.useState(false);
  const [judgePickerOpen, setJudgePickerOpen] = React.useState(false);
  const [athletePickerSelected, setAthletePickerSelected] = React.useState<string[]>([]);
  const [judgePickerSelected, setJudgePickerSelected] = React.useState<string[]>([]);
  const [resetSecretIndex, setResetSecretIndex] = React.useState<number | null>(null);
  const [copiedSecretIndex, setCopiedSecretIndex] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    kind: "athlete" | "official";
    index: number;
    name: string;
  } | null>(null);

  const isEdit = mode === "edit";

  const resetSecretOfficial =
    resetSecretIndex !== null ? form.officials[resetSecretIndex] : null;
  const resetSecretJudgeName = resetSecretOfficial
    ? judgeOptions.find((j) => j.id === resetSecretOfficial.judgeId)?.name ??
      resetSecretOfficial.judgeId
    : "";

  const handleCopySecret = async (index: number, code: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSecretIndex(index);
      window.setTimeout(
        () => setCopiedSecretIndex((cur) => (cur === index ? null : cur)),
        2000,
      );
    } catch {
      setError("ไม่สามารถคัดลอกรหัสได้");
    }
  };

  const filteredAthletes = athleteOptions.filter((a) => {
    if (!athleteSearch) return true;
    const q = athleteSearch.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
  });

  const filteredJudges = judgeOptions.filter((j) => {
    if (!judgeSearch) return true;
    const q = judgeSearch.toLowerCase();
    return j.name.toLowerCase().includes(q) || j.id.toLowerCase().includes(q);
  });

  const handleRemoveAthlete = (index: number) =>
    setForm((p) => ({ ...p, athletes: p.athletes.filter((_, i) => i !== index) }));

  const handleBibChange = (index: number, bib: string) =>
    setForm((p) => ({
      ...p,
      athletes: p.athletes.map((a, i) => (i === index ? { ...a, bib } : a)),
    }));

  const handleRemoveOfficial = (index: number) =>
    setForm((p) => ({ ...p, officials: p.officials.filter((_, i) => i !== index) }));

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "athlete") handleRemoveAthlete(deleteTarget.index);
    else handleRemoveOfficial(deleteTarget.index);
    setDeleteTarget(null);
  };

  const handleZoneChange = (index: number, zone: string) =>
    setForm((p) => ({
      ...p,
      officials: p.officials.map((o, i) => (i === index ? { ...o, zone } : o)),
    }));

  const judgeCount = form.officials.filter((o) => o.position === "JUDGE").length;
  const headCount = form.officials.filter((o) => o.position === "HEAD_JUDGE").length;
  const loggerCount = form.officials.filter((o) => o.position === "EVENT_LOGGER").length;
  // A round can only be "started" (ONGOING/FINISHED) with ≥1 of each official.
  const officialsComplete = headCount >= 1 && judgeCount >= 1 && loggerCount >= 1;

  // Duplicate detection — warns in red but NEVER blocks input or submission.
  // Bib: compared by trimmed value. Zone/โต๊ะ: compared case-insensitively, and
  // blank zones (head judge / lap-time logger have none) are ignored.
  const bibDup = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of form.athletes) {
      const t = a.bib.trim();
      if (!t) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const keys = new Set<string>();
    for (const [k, n] of counts) if (n > 1) keys.add(k);
    return { keys, labels: [...keys] };
  }, [form.athletes]);

  const zoneDup = React.useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const o of form.officials) {
      const t = o.zone.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      const arr = groups.get(k) ?? [];
      arr.push(t);
      groups.set(k, arr);
    }
    const keys = new Set<string>();
    const labels: string[] = [];
    for (const [k, arr] of groups) {
      if (arr.length > 1) {
        keys.add(k);
        labels.push(arr[0] ?? k);
      }
    }
    return { keys, labels };
  }, [form.officials]);

  const maxForPosition = (pos: OfficialEntry["position"]) =>
    pos === "JUDGE" ? MAX_JUDGES : pos === "HEAD_JUDGE" ? MAX_HEAD_JUDGE : MAX_EVENT_LOGGER;

  const handlePositionChange = (index: number, position: OfficialEntry["position"]) => {
    const max = maxForPosition(position);
    const others = form.officials.filter((o, i) => o.position === position && i !== index).length;
    if (others >= max) {
      setError(`${POSITION_LABEL[position]} เลือกได้สูงสุด ${max} คนต่อรอบ`);
      return;
    }
    setError(null);
    setForm((p) => ({
      ...p,
      officials: p.officials.map((o, i) => (i === index ? { ...o, position } : o)),
    }));
  };

  const handleRegenerateSecret = (index: number) =>
    setForm((p) => ({
      ...p,
      officials: p.officials.map((o, i) =>
        i === index ? { ...o, secretCode: generateSecretCode() } : o,
      ),
    }));

  const confirmResetSecret = () => {
    if (resetSecretIndex === null) return;
    handleRegenerateSecret(resetSecretIndex);
    setResetSecretIndex(null);
  };

  const confirmAthletePicker = () => {
    const existing = new Set(form.athletes.map((a) => a.athleteId));
    const toAdd = athletePickerSelected.filter((id) => !existing.has(id));
    if (toAdd.length > 0) {
      setForm((p) => ({
        ...p,
        athletes: [...p.athletes, ...toAdd.map((id) => ({ athleteId: id, bib: "" }))],
      }));
    }
    setAthletePickerOpen(false);
    setAthletePickerSelected([]);
  };

  const confirmJudgePicker = () => {
    const existing = new Set(form.officials.map((o) => o.judgeId));
    const toAdd = judgePickerSelected.filter((id) => !existing.has(id));
    if (toAdd.length > 0) {
      setForm((p) => {
        let judges = p.officials.filter((o) => o.position === "JUDGE").length;
        let heads = p.officials.filter((o) => o.position === "HEAD_JUDGE").length;
        let loggers = p.officials.filter((o) => o.position === "EVENT_LOGGER").length;
        // Fill open slots in order: กรรมการ (≤8) → หัวหน้ากรรมการ (≤1) → ผู้เก็บ Lap Time (≤1).
        // Extras beyond 10 are skipped (the admin can re-assign positions afterwards).
        const added: OfficialEntry[] = [];
        for (const id of toAdd) {
          let position: OfficialEntry["position"] | null = null;
          if (judges < MAX_JUDGES) {
            position = "JUDGE";
            judges += 1;
          } else if (heads < MAX_HEAD_JUDGE) {
            position = "HEAD_JUDGE";
            heads += 1;
          } else if (loggers < MAX_EVENT_LOGGER) {
            position = "EVENT_LOGGER";
            loggers += 1;
          }
          if (position) {
            added.push({ judgeId: id, zone: "", secretCode: generateSecretCode(), position });
          }
        }
        return { ...p, officials: [...p.officials, ...added] };
      });
    }
    setJudgePickerOpen(false);
    setJudgePickerSelected([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (judgeCount > MAX_JUDGES) {
      setError(`กรรมการ (Judge) ต้องไม่เกิน ${MAX_JUDGES} คนต่อรอบ — ปัจจุบัน ${judgeCount} คน`);
      return;
    }
    if (headCount > MAX_HEAD_JUDGE) {
      setError(`หัวหน้ากรรมการ เลือกได้สูงสุด ${MAX_HEAD_JUDGE} คนต่อรอบ — ปัจจุบัน ${headCount} คน`);
      return;
    }
    if (loggerCount > MAX_EVENT_LOGGER) {
      setError(`ผู้เก็บ Lap Time เลือกได้สูงสุด ${MAX_EVENT_LOGGER} คนต่อรอบ — ปัจจุบัน ${loggerCount} คน`);
      return;
    }
    if (form.status !== "SCHEDULED" && !officialsComplete) {
      setError(
        'ต้องมีหัวหน้ากรรมการ, กรรมการ และผู้เก็บ Lap Time อย่างน้อยอย่างละ 1 คน ก่อนตั้งสถานะเป็น "กำลังแข่งขัน" — มิฉะนั้นเลือกได้แค่ "กำหนดการ"',
      );
      return;
    }
    startTransition(async () => {
      try {
        if (isEdit && roundId) {
          await updateRound(eventId, roundId, form);
        } else {
          await createRound(eventId, form);
        }
        router.push(`/admin/events/${eventId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <>
      <Dialog
        open={resetSecretIndex !== null}
        onOpenChange={(open) => {
          if (!open) setResetSecretIndex(null);
        }}
      >
        <DialogContent className="border-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">ยืนยันรีเซ็ตรหัสลับ?</DialogTitle>
            <DialogDescription className="text-left text-slate-600">
              รหัสลับของ{" "}
              <span className="font-medium text-slate-900">{resetSecretJudgeName}</span>{" "}
              จะถูกสร้างใหม่ รหัสเดิมจะใช้เข้าระบบไม่ได้อีก
              {resetSecretOfficial?.secretCode && (
                <span className="mt-2 block font-mono text-xs text-slate-500">
                  รหัสปัจจุบัน: {resetSecretOfficial.secretCode}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => setResetSecretIndex(null)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              onClick={confirmResetSecret}
            >
              ยืนยันรีเซ็ต
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="border-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">ยืนยันการลบ?</DialogTitle>
            <DialogDescription className="text-left text-slate-600">
              ลบ{deleteTarget?.kind === "athlete" ? "นักกีฬา" : "เจ้าหน้าที่"}{" "}
              <span className="font-medium text-slate-900">{deleteTarget?.name}</span>{" "}
              ออกจากรายการในรอบนี้
              <span className="mt-1 block text-xs text-slate-500">
                (ยังไม่บันทึกลงฐานข้อมูลจนกว่าจะกด{isEdit ? "บันทึก" : "สร้างรอบ"})
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => setDeleteTarget(null)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
            >
              ยืนยันลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <Card className="rounded-2xl border-slate-200">
      <CardContent className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">ชื่อรอบแข่ง</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น รอบที่ 1 - ชาย 20 กม."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                วันและเวลาเริ่มแข่ง
              </label>
              <Input
                type="datetime-local"
                value={form.scheduledTime}
                onChange={(e) => setForm((p) => ({ ...p, scheduledTime: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                ระยะทาง (กม.)
              </label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.distanceKm}
                onChange={(e) => setForm((p) => ({ ...p, distanceKm: e.target.value }))}
                placeholder="เช่น 10, 20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                จำนวนรอบสนาม (Laps) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                step="1"
                required
                value={form.lapCount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lapCount: Math.max(1, Number(e.target.value) || 1) }))
                }
                placeholder="เช่น 10, 20"
              />
              <p className="text-[11px] text-slate-500">
                Default ตั้งตาม Event — แก้ได้ถ้ารอบนี้ใช้สนามต่างกัน
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">สถานะรอบแข่ง</label>
              <select
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/5"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as RoundFormValues["status"] }))
                }
              >
                <option value="SCHEDULED">กำหนดการ – ตั้งเวลาไว้แล้ว</option>
                <option value="ONGOING" disabled={!officialsComplete}>
                  กำลังดำเนินการ – กำลังแข่งขัน
                </option>
                <option value="FINISHED" disabled={!officialsComplete}>
                  เสร็จสิ้น – แข่งขันเสร็จแล้ว
                </option>
              </select>
              {!officialsComplete && (
                <p className="text-[11px] text-amber-600">
                  ต้องมีหัวหน้ากรรมการ, กรรมการ และผู้เก็บ Lap Time อย่างน้อยอย่างละ 1 คน
                  จึงจะตั้งสถานะเป็น “กำลังแข่งขัน” ได้
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-800">หมายเหตุ</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="เช่น รอ Admin กดเริ่มจับเวลา, หมายเหตุสำหรับผู้ดูแลรอบ"
                rows={3}
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
              <p className="text-[11px] text-slate-500">
                แสดงในหน้าผู้ดูแลรอบ (Moderator) ใต้ชื่อรอบแข่ง
              </p>
            </div>
          </div>

          {/* Athletes */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  รายชื่อนักกีฬาในรอบนี้
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  เลือกนักกีฬาและกำหนดหมายเลข bib ให้แต่ละคน
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-lg px-3 text-xs"
                onClick={() => {
                  setAthletePickerSelected([]);
                  setAthleteSearch("");
                  setAthletePickerOpen(true);
                }}
              >
                + เพิ่มนักกีฬา
              </Button>
            </div>

            {bibDup.keys.size > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                <span aria-hidden>⚠</span>
                <span>
                  มีหมายเลข Bib ซ้ำกัน:{" "}
                  <span className="font-semibold">{bibDup.labels.join(", ")}</span> — กรุณาตรวจสอบ
                  (ระบบยังให้บันทึกได้ แต่ Bib ต้องไม่ซ้ำกันในรอบเดียวกัน)
                </span>
              </div>
            )}

            <div className="min-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">นักกีฬา</th>
                    <th className="px-3 py-2 text-left">หมายเลข Bib</th>
                    <th className="px-3 py-2 text-right">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {form.athletes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-[11px] text-slate-500">
                        ยังไม่มีนักกีฬา – กด &quot;เพิ่มนักกีฬา&quot;
                      </td>
                    </tr>
                  ) : (
                    form.athletes.map((row, i) => (
                      <tr key={row.athleteId} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-[11px] text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-slate-800">
                            {athleteOptions.find((a) => a.id === row.athleteId)?.name ?? row.athleteId}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className={`h-7 w-28 px-2 py-1 text-xs ${
                              row.bib.trim() !== "" && bibDup.keys.has(row.bib.trim())
                                ? "border-red-400 text-red-700 focus-visible:ring-red-200"
                                : ""
                            }`}
                            value={row.bib}
                            onChange={(e) => handleBibChange(i, e.target.value)}
                            placeholder="เช่น 101"
                            aria-invalid={
                              row.bib.trim() !== "" && bibDup.keys.has(row.bib.trim())
                                ? true
                                : undefined
                            }
                          />
                          {row.bib.trim() !== "" && bibDup.keys.has(row.bib.trim()) && (
                            <p className="mt-1 text-[10px] font-medium text-red-600">
                              ⚠ หมายเลข Bib ซ้ำ
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "athlete",
                                index: i,
                                name:
                                  athleteOptions.find((a) => a.id === row.athleteId)?.name ??
                                  row.athleteId,
                              })
                            }
                          >
                            ลบ
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Officials */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  กรรมการ / เจ้าหน้าที่ในรอบนี้
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  เลือกกรรมการ กำหนดตำแหน่ง โซน และรหัสลับสำหรับ join — สูงสุด {MAX_JUDGES} กรรมการ +{" "}
                  {MAX_HEAD_JUDGE} หัวหน้ากรรมการ + {MAX_EVENT_LOGGER} ผู้เก็บ Lap Time (รวม{" "}
                  {MAX_JUDGES + MAX_HEAD_JUDGE + MAX_EVENT_LOGGER} คน)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={countChipCls(judgeCount > MAX_JUDGES)}>
                  กรรมการ {judgeCount}/{MAX_JUDGES}
                </span>
                <span className={countChipCls(headCount > MAX_HEAD_JUDGE)}>
                  หัวหน้า {headCount}/{MAX_HEAD_JUDGE}
                </span>
                <span className={countChipCls(loggerCount > MAX_EVENT_LOGGER)}>
                  Lap {loggerCount}/{MAX_EVENT_LOGGER}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 rounded-lg px-3 text-xs"
                  onClick={() => {
                    setJudgePickerSelected([]);
                    setJudgeSearch("");
                    setJudgePickerOpen(true);
                  }}
                >
                  + เพิ่มเจ้าหน้าที่
                </Button>
              </div>
            </div>

            {zoneDup.keys.size > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                <span aria-hidden>⚠</span>
                <span>
                  มีโซน / โต๊ะ ซ้ำกัน:{" "}
                  <span className="font-semibold">{zoneDup.labels.join(", ")}</span> —
                  กรรมการแต่ละคนควรอยู่คนละโซน (ระบบยังให้บันทึกได้)
                </span>
              </div>
            )}

            <div className="min-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">กรรมการ</th>
                    <th className="px-3 py-2 text-left">ตำแหน่ง</th>
                    <th className="px-3 py-2 text-left">โซน / โต๊ะ</th>
                    <th className="px-3 py-2 text-left">รหัสลับ (6 ตัว)</th>
                    <th className="px-3 py-2 text-right">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {form.officials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-[11px] text-slate-500">
                        ยังไม่มีกรรมการ – กด &quot;เพิ่มกรรมการ&quot;
                      </td>
                    </tr>
                  ) : (
                    form.officials.map((row, i) => (
                      <tr key={row.judgeId} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-[11px] text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-slate-800">
                            {judgeOptions.find((j) => j.id === row.judgeId)?.name ?? row.judgeId}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 shadow-sm"
                            value={row.position}
                            onChange={(e) =>
                              handlePositionChange(i, e.target.value as OfficialEntry["position"])
                            }
                          >
                            {Object.entries(POSITION_LABEL).map(([val, label]) => (
                              <option key={val} value={val}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className={`h-7 w-24 px-2 py-1 text-xs ${
                              row.zone.trim() !== "" &&
                              zoneDup.keys.has(row.zone.trim().toLowerCase())
                                ? "border-red-400 text-red-700 focus-visible:ring-red-200"
                                : ""
                            }`}
                            value={row.zone}
                            onChange={(e) => handleZoneChange(i, e.target.value)}
                            placeholder="เช่น A, 1"
                            aria-invalid={
                              row.zone.trim() !== "" &&
                              zoneDup.keys.has(row.zone.trim().toLowerCase())
                                ? true
                                : undefined
                            }
                          />
                          {row.zone.trim() !== "" &&
                            zoneDup.keys.has(row.zone.trim().toLowerCase()) && (
                              <p className="mt-1 text-[10px] font-medium text-red-600">
                                ⚠ โซน/โต๊ะ ซ้ำ
                              </p>
                            )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex cursor-default select-none items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-800"
                              onCopy={(e) => e.preventDefault()}
                            >
                              {row.secretCode || "------"}
                            </span>
                            <Tooltip open={copiedSecretIndex === i}>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 rounded-lg border-slate-200 p-0"
                                  disabled={!row.secretCode}
                                  aria-label="คัดลอกรหัสลับ"
                                  onClick={() => handleCopySecret(i, row.secretCode)}
                                >
                                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Copied!</TooltipContent>
                            </Tooltip>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-lg border-slate-200 px-2 text-[11px]"
                              onClick={() => setResetSecretIndex(i)}
                            >
                              รีเซ็ต
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "official",
                                index: i,
                                name:
                                  judgeOptions.find((j) => j.id === row.judgeId)?.name ?? row.judgeId,
                              })
                            }
                          >
                            ลบ
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isPending
                ? "กำลังบันทึก..."
                : isEdit
                ? "บันทึกการเปลี่ยนแปลง"
                : "สร้างรอบแข่งใหม่"}
            </Button>
          </div>
        </form>

        {/* Athlete Picker Modal */}
        {athletePickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">เพิ่มนักกีฬาเข้ารอบ</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg px-2 text-[11px]"
                  onClick={() => setAthletePickerOpen(false)}
                >
                  ปิด
                </Button>
              </div>

              <Input
                className="mb-3 h-8 px-2 py-1 text-xs"
                placeholder="ค้นหานักกีฬา..."
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
              />

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                <ul className="divide-y divide-slate-200 text-xs">
                  {filteredAthletes.length === 0 ? (
                    <li className="px-3 py-3 text-center text-[11px] text-slate-500">
                      ไม่พบนักกีฬาตามคำค้นหา
                    </li>
                  ) : (
                    [...filteredAthletes]
                      .sort((a, b) => {
                        const aIn = form.athletes.some((x) => x.athleteId === a.id);
                        const bIn = form.athletes.some((x) => x.athleteId === b.id);
                        if (aIn === bIn) return 0;
                        return aIn ? 1 : -1;
                      })
                      .map((athlete) => {
                        const alreadyIn = form.athletes.some((x) => x.athleteId === athlete.id);
                        const checked = athletePickerSelected.includes(athlete.id);
                        return (
                          <li
                            key={athlete.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/80"
                          >
                            <label className="flex flex-1 items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-slate-300"
                                disabled={alreadyIn}
                                checked={checked && !alreadyIn}
                                onChange={() =>
                                  !alreadyIn &&
                                  setAthletePickerSelected((p) =>
                                    p.includes(athlete.id)
                                      ? p.filter((x) => x !== athlete.id)
                                      : [...p, athlete.id],
                                  )
                                }
                              />
                              <span className="truncate">{athlete.name}</span>
                            </label>
                            {alreadyIn && (
                              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                อยู่ในรอบแล้ว
                              </span>
                            )}
                          </li>
                        );
                      })
                  )}
                </ul>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={() => setAthletePickerOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={confirmAthletePicker}
                  disabled={athletePickerSelected.length === 0}
                >
                  ยืนยันการเพิ่ม ({athletePickerSelected.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Judge Picker Modal */}
        {judgePickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">เพิ่มกรรมการเข้ารอบ</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg px-2 text-[11px]"
                  onClick={() => setJudgePickerOpen(false)}
                >
                  ปิด
                </Button>
              </div>

              <Input
                className="mb-3 h-8 px-2 py-1 text-xs"
                placeholder="ค้นหากรรมการ..."
                value={judgeSearch}
                onChange={(e) => setJudgeSearch(e.target.value)}
              />

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                <ul className="divide-y divide-slate-200 text-xs">
                  {filteredJudges.length === 0 ? (
                    <li className="px-3 py-3 text-center text-[11px] text-slate-500">
                      ไม่พบกรรมการตามคำค้นหา
                    </li>
                  ) : (
                    [...filteredJudges]
                      .sort((a, b) => {
                        const aIn = form.officials.some((x) => x.judgeId === a.id);
                        const bIn = form.officials.some((x) => x.judgeId === b.id);
                        if (aIn === bIn) return 0;
                        return aIn ? 1 : -1;
                      })
                      .map((judge) => {
                        const alreadyIn = form.officials.some((x) => x.judgeId === judge.id);
                        const checked = judgePickerSelected.includes(judge.id);
                        return (
                          <li
                            key={judge.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-slate-50/80"
                          >
                            <label className="flex flex-1 items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-slate-300"
                                disabled={alreadyIn}
                                checked={checked && !alreadyIn}
                                onChange={() =>
                                  !alreadyIn &&
                                  setJudgePickerSelected((p) =>
                                    p.includes(judge.id)
                                      ? p.filter((x) => x !== judge.id)
                                      : [...p, judge.id],
                                  )
                                }
                              />
                              <span className="truncate">{judge.name}</span>
                            </label>
                            {alreadyIn && (
                              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                อยู่ในรอบแล้ว
                              </span>
                            )}
                          </li>
                        );
                      })
                  )}
                </ul>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={() => setJudgePickerOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  onClick={confirmJudgePicker}
                  disabled={judgePickerSelected.length === 0}
                >
                  ยืนยันการเพิ่ม ({judgePickerSelected.length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}

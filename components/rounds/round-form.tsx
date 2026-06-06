"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import { Check, Copy, GripVertical, Lock } from "lucide-react";
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
import type { EventAthleteOption } from "@/types/event-athlete";
import { kmFromMeters } from "@/lib/distance";

export type JudgeOption = { id: string; name: string };

type AthleteEntry = { athleteId: string };
type OfficialEntry = {
  judgeId: string;
  zone: string;
  secretCode: string;
  position: "JUDGE" | "HEAD_JUDGE" | "EVENT_LOGGER";
};

export type RoundFormValues = {
  name: string;
  scheduledTime: string;
  expectedEndTime: string;
  /** distance in METRES (UI unit) — converted to km on save */
  distanceMeters: string;
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
  /** Athletes registered for the parent event (with their event-level BIBs). */
  eventAthletes: EventAthleteOption[];
  judgeOptions: JudgeOption[];
  /** Event start day (yyyy-mm-dd) — a round may not be scheduled before it. */
  eventDate?: string;
  /**
   * Secret codes already used by OTHER rounds in this event. New/regenerated
   * codes avoid these so codes stay unique across the whole event (rounds can
   * run simultaneously; the join resolves a code within the event).
   */
  existingEventCodes?: string[];
  /** Lock the whole form (read-only) — used while the round is ONGOING. */
  locked?: boolean;
  defaultValues?: Partial<RoundFormValues>;
};

const EMPTY: RoundFormValues = {
  name: "",
  scheduledTime: "",
  expectedEndTime: "",
  distanceMeters: "",
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
  // Cryptographically-secure RNG (Web Crypto, available in browsers and Node 18+).
  // 256 is a multiple of SECRET_CHARS.length (32) → uniform, no modulo bias.
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += SECRET_CHARS[bytes[i] % SECRET_CHARS.length] ?? "X";
  }
  return code;
}

/** A code not already in `used` (codes are compared uppercase). Adds it to the set. */
function genUniqueSecret(used: Set<string>): string {
  let code = generateSecretCode();
  let guard = 0;
  while (used.has(code) && guard++ < 50) code = generateSecretCode();
  used.add(code);
  return code;
}

const POSITION_LABEL: Record<OfficialEntry["position"], string> = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  EVENT_LOGGER: "เก็บ Lap Time",
};

/**
 * One draggable athlete row in the round's start list. The number (seq) is the
 * athlete's position in the round — this is what the Lap Time keeper screen shows.
 * Reorder by dragging the grip handle OR by clicking the number, typing a new
 * position and pressing Enter / ✓ (the list then re-sorts).
 */
function RoundAthleteReorderRow({
  athleteId,
  seq,
  bib,
  name,
  isEditingPos,
  editPosValue,
  onRemove,
  onStartEditPos,
  onChangeEditPos,
  onCommitPos,
  onCancelPos,
}: Readonly<{
  athleteId: string;
  seq: number;
  bib: string;
  name: string;
  isEditingPos: boolean;
  editPosValue: string;
  onRemove: () => void;
  onStartEditPos: () => void;
  onChangeEditPos: (value: string) => void;
  onCommitPos: () => void;
  onCancelPos: () => void;
}>) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={athleteId}
      dragListener={false}
      dragControls={controls}
      as="div"
      className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 last:border-b-0"
    >
      <button
        type="button"
        aria-label="ลากเพื่อจัดลำดับ"
        onPointerDown={(e) => controls.start(e)}
        className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-slate-400 hover:text-slate-600 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Position — click to edit, Enter / ✓ to apply (the list then re-sorts) */}
      <span className="flex w-16 shrink-0 items-center gap-1">
        {isEditingPos ? (
          <>
            <input
              type="number"
              min={1}
              autoFocus
              value={editPosValue}
              onChange={(e) => onChangeEditPos(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCommitPos();
                } else if (e.key === "Escape") {
                  onCancelPos();
                }
              }}
              onBlur={onCommitPos}
              className="h-7 w-10 rounded-md border border-slate-300 px-1 text-center text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <button
              type="button"
              aria-label="บันทึกลำดับ"
              // onMouseDown (not onClick) so it fires before the input's onBlur cancels it
              onMouseDown={(e) => {
                e.preventDefault();
                onCommitPos();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStartEditPos}
            title="คลิกเพื่อแก้ลำดับ"
            className="h-7 w-7 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            {seq}
          </button>
        )}
      </span>

      <span className="w-16 shrink-0 font-mono text-xs font-semibold text-slate-800">{bib}</span>
      <span className="flex-1 truncate text-xs text-slate-800">{name}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-12 shrink-0 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
        onClick={onRemove}
      >
        ลบ
      </Button>
    </Reorder.Item>
  );
}

export function RoundForm({
  mode,
  eventId,
  roundId,
  eventAthletes,
  judgeOptions,
  eventDate,
  existingEventCodes,
  locked = false,
  defaultValues,
}: Readonly<RoundFormProps>) {
  const router = useRouter();
  // Codes used by other rounds of the event — new codes avoid these.
  const baseUsedCodes = React.useMemo(
    () => new Set((existingEventCodes ?? []).map((c) => c.toUpperCase())),
    [existingEventCodes],
  );
  const [form, setForm] = React.useState<RoundFormValues>(() => {
    const used = new Set((existingEventCodes ?? []).map((c) => c.toUpperCase()));
    const officials = (defaultValues?.officials ?? []).map((o) => {
      if (o.secretCode) {
        used.add(o.secretCode.toUpperCase());
        return o;
      }
      return { ...o, secretCode: genUniqueSecret(used) };
    });
    return { ...EMPTY, ...defaultValues, officials };
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
  const submitLabel = isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างรอบแข่งใหม่";

  const resetSecretOfficial =
    resetSecretIndex === null ? null : form.officials[resetSecretIndex];
  const resetSecretJudgeName = resetSecretOfficial
    ? judgeOptions.find((j) => j.id === resetSecretOfficial.judgeId)?.name ??
      resetSecretOfficial.judgeId
    : "";

  const handleCopySecret = async (index: number, code: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSecretIndex(index);
      globalThis.setTimeout(
        () => setCopiedSecretIndex((cur) => (cur === index ? null : cur)),
        2000,
      );
    } catch {
      setError("ไม่สามารถคัดลอกรหัสได้");
    }
  };

  // BIB-first search: BIB prefix match takes precedence, then falls back to name.
  const filteredAthletes = eventAthletes.filter((ea) => {
    if (!athleteSearch) return true;
    const q = athleteSearch.toLowerCase();
    return ea.bib.toLowerCase().startsWith(q) || ea.athleteName.toLowerCase().includes(q);
  });

  // Map for O(1) BIB lookup in the athlete table.
  const bibByAthleteId = React.useMemo(
    () => new Map(eventAthletes.map((ea) => [ea.athleteId, ea.bib])),
    [eventAthletes],
  );

  const filteredJudges = judgeOptions.filter((j) => {
    if (!judgeSearch) return true;
    const q = judgeSearch.toLowerCase();
    return j.name.toLowerCase().includes(q) || j.id.toLowerCase().includes(q);
  });

  const handleRemoveAthlete = (index: number) =>
    setForm((p) => ({ ...p, athletes: p.athletes.filter((_, i) => i !== index) }));

  // Inline position editing — click the number, type a new 1-based position, Enter / ✓.
  const [editPosId, setEditPosId] = React.useState<string | null>(null);
  const [editPosValue, setEditPosValue] = React.useState("");

  // Move an athlete to a new 1-based position; the rest shift to fill in.
  const movePosition = (athleteId: string, newPos1: number) =>
    setForm((p) => {
      const from = p.athletes.findIndex((a) => a.athleteId === athleteId);
      if (from < 0 || Number.isNaN(newPos1)) return p;
      const to = Math.min(Math.max(0, newPos1 - 1), p.athletes.length - 1);
      if (to === from) return p;
      const next = [...p.athletes];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...p, athletes: next };
    });

  const commitPosEdit = (athleteId: string) => {
    const n = Number.parseInt(editPosValue, 10);
    if (!Number.isNaN(n)) movePosition(athleteId, n);
    setEditPosId(null);
    setEditPosValue("");
  };

  // Drag-and-drop reorder — Framer Motion returns the reordered athleteIds.
  const handleReorderAthletes = (orderedIds: string[]) =>
    setForm((p) => {
      const byId = new Map(p.athletes.map((a) => [a.athleteId, a]));
      return { ...p, athletes: orderedIds.map((id) => byId.get(id)).filter(Boolean) as AthleteEntry[] };
    });

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
  // Zone/โต๊ะ: compared case-insensitively; blank zones are ignored.
  // BIB duplicates cannot occur here — uniqueness is enforced at the Event level.
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

  const maxForPosition = (pos: OfficialEntry["position"]) => {
    const maxNonJudge = pos === "HEAD_JUDGE" ? MAX_HEAD_JUDGE : MAX_EVENT_LOGGER;
    return pos === "JUDGE" ? MAX_JUDGES : maxNonJudge;
  };

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
    setForm((p) => {
      const used = new Set(baseUsedCodes);
      p.officials.forEach((o, i) => {
        if (i !== index && o.secretCode) used.add(o.secretCode.toUpperCase());
      });
      const code = genUniqueSecret(used);
      return {
        ...p,
        officials: p.officials.map((o, i) => (i === index ? { ...o, secretCode: code } : o)),
      };
    });

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
        athletes: [...p.athletes, ...toAdd.map((id) => ({ athleteId: id }))],
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
        // Codes already in play (other rounds + this form) — keep new ones unique.
        const used = new Set(baseUsedCodes);
        p.officials.forEach((o) => o.secretCode && used.add(o.secretCode.toUpperCase()));
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
            added.push({ judgeId: id, zone: "", secretCode: genUniqueSecret(used), position });
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
    // Round date/time must not fall before the event's start day.
    if (eventDate && form.scheduledTime && form.scheduledTime.slice(0, 10) < eventDate) {
      setError(`วันและเวลาเริ่มของรอบต้องไม่ก่อนวันเริ่มกิจกรรม (${eventDate})`);
      return;
    }
    if (eventDate && form.expectedEndTime && form.expectedEndTime.slice(0, 10) < eventDate) {
      setError(`วันและเวลาสิ้นสุดของรอบต้องไม่ก่อนวันเริ่มกิจกรรม (${eventDate})`);
      return;
    }
    if (
      form.scheduledTime &&
      form.expectedEndTime &&
      form.expectedEndTime < form.scheduledTime
    ) {
      setError("เวลาสิ้นสุด (โดยประมาณ) ต้องไม่ก่อนเวลาเริ่มของรอบ");
      return;
    }
    // The form works in metres; storage is km — convert at the boundary.
    const { distanceMeters, ...rest } = form;
    const payload = { ...rest, distanceKm: kmFromMeters(distanceMeters) };
    startTransition(async () => {
      try {
        if (isEdit && roundId) {
          await updateRound(eventId, roundId, payload);
        } else {
          await createRound(eventId, payload);
        }
        // redirect() inside the Server Action handles navigation to the event page.
        // router.push here is a safety-net in case the redirect response is not
        // handled (e.g. an unexpected code path that returns without redirecting).
        router.push(`/admin/events/${eventId}`);
      } catch (err) {
        // Filter out Next.js redirect "errors" — they are not real errors; they
        // indicate successful navigation handled by the framework. Swallowing them
        // here prevents setError from showing a spurious error banner when the
        // Server Action calls redirect() on success.
        const msg = err instanceof Error ? err.message : "";
        if (msg === "NEXT_REDIRECT" || msg.startsWith("NEXT_REDIRECT")) return;
        setError(msg || "เกิดข้อผิดพลาด");
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
            <DialogTitle className="text-slate-900">ยืนยันรีเซ็ตรหัสกรรมการ?</DialogTitle>
            <DialogDescription className="text-left text-slate-600">
              รหัสกรรมการของ{" "}
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
          {locked && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">รอบนี้กำลังแข่งขันอยู่ — แก้ไขข้อมูลไม่ได้</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  จะแก้ไขได้อีกครั้งเมื่อรอบจบการแข่งขัน • หากต้องแก้ไขระหว่างแข่ง ให้ใช้หน้า “Moderator”
                </p>
              </div>
            </div>
          )}
          {/* All controls disable natively when the round is live (locked). */}
          <fieldset disabled={locked} className="min-w-0 space-y-5">
          {/* Basic info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="round-name" className="text-sm font-medium text-slate-800">ชื่อรอบแข่ง</label>
              <Input
                id="round-name"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น รอบที่ 1 - ชาย 20 กม."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-scheduled-time" className="text-sm font-medium text-slate-800">
                วันและเวลาเริ่มแข่ง
              </label>
              <Input
                id="round-scheduled-time"
                type="datetime-local"
                min={eventDate ? `${eventDate}T00:00` : undefined}
                value={form.scheduledTime}
                onChange={(e) => setForm((p) => ({ ...p, scheduledTime: e.target.value }))}
              />
              {eventDate && (
                <p className="text-[11px] text-slate-500">
                  ต้องไม่ก่อนวันเริ่มกิจกรรม ({eventDate})
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-expected-end-time" className="text-sm font-medium text-slate-800">
                วันและเวลาสิ้นสุด (โดยประมาณ)
              </label>
              <Input
                id="round-expected-end-time"
                type="datetime-local"
                min={form.scheduledTime || (eventDate ? `${eventDate}T00:00` : undefined)}
                value={form.expectedEndTime}
                onChange={(e) => setForm((p) => ({ ...p, expectedEndTime: e.target.value }))}
              />
              <p className="text-[11px] text-slate-500">
                ใช้ตรวจเวลาทับซ้อนกับรายการอื่น — ถ้าเว้นว่าง ระบบจะประมาณจากระยะทาง (~5 นาที/กม.)
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-distance" className="text-sm font-medium text-slate-800">
                ระยะทาง (เมตร)
              </label>
              <Input
                id="round-distance"
                type="number"
                min={0}
                step="any"
                value={form.distanceMeters}
                onChange={(e) => setForm((p) => ({ ...p, distanceMeters: e.target.value }))}
                placeholder="เช่น 10000, 20000"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-lap-count" className="text-sm font-medium text-slate-800">
                จำนวนรอบสนาม (Laps) <span className="text-red-500">*</span>
              </label>
              <Input
                id="round-lap-count"
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
              <label htmlFor="round-status" className="text-sm font-medium text-slate-800">สถานะรอบแข่ง</label>
              <select
                id="round-status"
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
              <label htmlFor="round-note" className="text-sm font-medium text-slate-800">หมายเหตุ</label>
              <textarea
                id="round-note"
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
                  เลือกนักกีฬาจากที่ลงทะเบียนใน Event — ลากไอคอน ⠿ เพื่อจัดลำดับ (ลำดับนี้ใช้แสดงในหน้าเก็บ Lap Time)
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-lg px-3 text-xs"
                disabled={eventAthletes.length === 0}
                onClick={() => {
                  setAthletePickerSelected([]);
                  setAthleteSearch("");
                  setAthletePickerOpen(true);
                }}
              >
                + เพิ่มนักกีฬา
              </Button>
            </div>

            {eventAthletes.length === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                <span aria-hidden>⚠</span>
                <span>
                  ยังไม่มีนักกีฬาลงทะเบียนใน Event นี้ — กรุณาเพิ่มนักกีฬาในหน้าแก้ไข Event ก่อน
                </span>
              </div>
            )}

            {form.athletes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-center text-[11px] text-slate-500">
                ยังไม่มีนักกีฬา – กด &quot;เพิ่มนักกีฬา&quot;
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium uppercase text-slate-500">
                  <span className="w-5 shrink-0" aria-hidden />
                  <span className="w-16 shrink-0">ลำดับ</span>
                  <span className="w-16 shrink-0">Bib</span>
                  <span className="flex-1">นักกีฬา</span>
                  <span className="w-12 shrink-0 text-right">ลบ</span>
                </div>
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={form.athletes.map((a) => a.athleteId)}
                  onReorder={handleReorderAthletes}
                >
                  {form.athletes.map((row, i) => {
                    const ea = eventAthletes.find((x) => x.athleteId === row.athleteId);
                    return (
                      <RoundAthleteReorderRow
                        key={row.athleteId}
                        athleteId={row.athleteId}
                        seq={i + 1}
                        bib={bibByAthleteId.get(row.athleteId) ?? "—"}
                        name={ea?.athleteName ?? row.athleteId}
                        isEditingPos={editPosId === row.athleteId}
                        editPosValue={editPosValue}
                        onStartEditPos={() => {
                          setEditPosId(row.athleteId);
                          setEditPosValue(String(i + 1));
                        }}
                        onChangeEditPos={setEditPosValue}
                        onCommitPos={() => commitPosEdit(row.athleteId)}
                        onCancelPos={() => {
                          setEditPosId(null);
                          setEditPosValue("");
                        }}
                        onRemove={() =>
                          setDeleteTarget({
                            kind: "athlete",
                            index: i,
                            name: ea?.athleteName ?? row.athleteId,
                          })
                        }
                      />
                    );
                  })}
                </Reorder.Group>
              </div>
            )}
          </div>

          {/* Officials */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  กรรมการ / เจ้าหน้าที่ในรอบนี้
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  เลือกกรรมการ กำหนดตำแหน่ง โซน และรหัสกรรมการสำหรับ join — สูงสุด {MAX_JUDGES} กรรมการ +{" "}
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
                    <th className="px-3 py-2 text-left">รหัสกรรมการ (6 ตัว)</th>
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
                                  aria-label="คัดลอกรหัสกรรมการ"
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
              {isPending ? "กำลังบันทึก..." : submitLabel}
            </Button>
          </div>
          </fieldset>
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
                placeholder="ค้นหาด้วย Bib หรือชื่อ..."
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
                        const aIn = form.athletes.some((x) => x.athleteId === a.athleteId);
                        const bIn = form.athletes.some((x) => x.athleteId === b.athleteId);
                        if (aIn === bIn) return 0;
                        return aIn ? 1 : -1;
                      })
                      .map((ea) => {
                        const alreadyIn = form.athletes.some((x) => x.athleteId === ea.athleteId);
                        const checked = athletePickerSelected.includes(ea.athleteId);
                        return (
                          <li
                            key={ea.athleteId}
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
                                    p.includes(ea.athleteId)
                                      ? p.filter((x) => x !== ea.athleteId)
                                      : [...p, ea.athleteId],
                                  )
                                }
                              />
                              <span className="font-mono font-semibold text-slate-700">{ea.bib}</span>
                              <span className="truncate text-slate-800">{ea.athleteName}</span>
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

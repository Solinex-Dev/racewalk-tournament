"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Gavel, Timer, Flag, History, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  moderatorDeleteCard,
  moderatorConfirmRedCard,
  moderatorRejectRedCard,
  moderatorEditCard,
  moderatorOverrideAthleteStatus,
  moderatorEditLapTime,
  moderatorDeleteLapTime,
  moderatorEditFinishTime,
  moderatorEditFinishPosition,
  moderatorDeleteFinishTime,
  moderatorEditRoundInfo,
} from "@/app/actions/moderator";
import {
  ModeratorEditDialog,
  type ModeratorEditDialogPayload,
} from "@/components/moderator/moderator-edit-dialog";
import { CardEditDialog } from "@/components/moderator/card-edit-dialog";
import { RoundInfoDialog } from "@/components/moderator/round-info-dialog";

import type {
  EditAthlete,
  EditCard,
  EditJudge,
  EditFinish,
  EditLap,
  EditRoundOption,
  EditRoundInfo,
  EditLogItem,
} from "./moderator-edit-types";

export type {
  EditRoundOption,
  EditAthlete,
  EditCard,
  EditJudge,
  EditLap,
  EditFinish,
  EditRoundInfo,
  EditLogItem,
} from "./moderator-edit-types";

export type ModeratorEditViewProps = {
  eventId: string;
  eventName: string;
  rounds: EditRoundOption[];
  selectedRoundId: string;
  athletes: EditAthlete[];
  judges: EditJudge[];
  cards: EditCard[];
  laps: EditLap[];
  finishes: EditFinish[];
  logs: EditLogItem[];
  roundInfo: EditRoundInfo | null;
};

function formatMs(ms: number): string {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseTimeString(str: string): number | null {
  const parts = str.trim().split(":").map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 1) return parts[0]! * 1000;
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000;
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000;
  return null;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function elapsed(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "—";
  if (!endIso) return "กำลังแข่งขัน";
  return formatMs(Math.max(0, new Date(endIso).getTime() - new Date(startIso).getTime()));
}

const SYMBOL_CHAR = { LIFTED_FOOT: "~", BENT_KNEE: ">" } as const;
const SYMBOL_LABEL = { LIFTED_FOOT: "ยกเท้า", BENT_KNEE: "เข่างอ" } as const;
const POSITION_LABEL = {
  JUDGE: "กรรมการ",
  HEAD_JUDGE: "หัวหน้ากรรมการ",
  EVENT_LOGGER: "ผู้เก็บ Lap Time",
} as const;

function redStateBadge(state: EditCard["state"]): { label: string; cls: string } | null {
  switch (state) {
    case "CONFIRMED":
      return { label: "ยืนยันแล้ว", cls: "bg-red-100 text-red-700" };
    case "PENDING":
      return { label: "รอยืนยัน", cls: "bg-orange-100 text-orange-700" };
    case "OVERRIDDEN":
      return { label: "ยกเลิกแล้ว", cls: "bg-slate-200 text-slate-500 line-through" };
    default:
      return null;
  }
}

export function ModeratorEditView(props: ModeratorEditViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [dialogPayload, setDialogPayload] =
    React.useState<ModeratorEditDialogPayload | null>(null);
  const dialogOpen = dialogPayload !== null;
  const [expandedJudges, setExpandedJudges] = React.useState<Set<string>>(new Set());
  const [expandedLapAthletes, setExpandedLapAthletes] = React.useState<Set<string>>(new Set());
  const [cardToEdit, setCardToEdit] = React.useState<EditCard | null>(null);
  const [roundInfoOpen, setRoundInfoOpen] = React.useState(false);

  const openDialog = (payload: ModeratorEditDialogPayload) => setDialogPayload(payload);
  const closeDialog = () => setDialogPayload(null);

  const handleCardEditConfirm = (data: {
    judgeId: string;
    color: "YELLOW" | "RED";
    symbol: "LIFTED_FOOT" | "BENT_KNEE";
    issuedAtMs: number;
    reason: string;
  }) => {
    if (!cardToEdit) return;
    const id = cardToEdit.id;
    startTransition(async () => {
      try {
        await moderatorEditCard(
          id,
          { judgeId: data.judgeId, color: data.color, symbol: data.symbol, issuedAtMs: data.issuedAtMs },
          data.reason,
        );
        toast.success("แก้ไขใบเรียบร้อย");
        setCardToEdit(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleRoundInfoConfirm = (data: {
    name: string;
    distanceKm: string;
    lapCount: number | null;
    startedAtMs: number | null;
    endedAtMs: number | null;
    reason: string;
  }) => {
    startTransition(async () => {
      try {
        await moderatorEditRoundInfo(
          props.selectedRoundId,
          {
            name: data.name,
            distanceKm: data.distanceKm,
            lapCount: data.lapCount ?? undefined,
            startedAtMs: data.startedAtMs,
            endedAtMs: data.endedAtMs,
          },
          data.reason,
        );
        toast.success("แก้ไขข้อมูลรอบเรียบร้อย");
        setRoundInfoOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  // ── grouping ────────────────────────────────────────────────────────────────
  const cardsByJudge = React.useMemo(() => {
    const m = new Map<string, EditCard[]>();
    for (const c of props.cards) {
      const arr = m.get(c.judgeId) ?? [];
      arr.push(c);
      m.set(c.judgeId, arr);
    }
    return m;
  }, [props.cards]);

  const lapsByAthlete = React.useMemo(() => {
    const m = new Map<string, EditLap[]>();
    for (const l of props.laps) {
      const arr = m.get(l.athleteId) ?? [];
      arr.push(l);
      m.set(l.athleteId, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.lapNumber - b.lapNumber);
    return m;
  }, [props.laps]);

  const lapAthletes = props.athletes.filter((a) => lapsByAthlete.has(a.id));

  // ── expand helpers ────────────────────────────────────────────────────────────
  const toggleJudge = (id: string) =>
    setExpandedJudges((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleLapAthlete = (id: string) =>
    setExpandedLapAthletes((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // ── dialog dispatch ────────────────────────────────────────────────────────────
  const handleDialogConfirm = ({
    reason,
    timeInput,
  }: {
    reason: string;
    timeInput?: string;
    symbolValue?: "LIFTED_FOOT" | "BENT_KNEE";
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
        run(() => moderatorDeleteCard(dialogPayload.card.id, reason), "ลบใบเรียบร้อย");
        break;
      case "confirm-red": {
        const card = dialogPayload.card;
        startTransition(async () => {
          try {
            const res = await moderatorConfirmRedCard(card.id, reason);
            toast.success(
              res?.dq
                ? "ยืนยันใบแดงแล้ว — นักกีฬาถูกตัดสิทธิ์ (DQ)"
                : "ยืนยันใบแดงเรียบร้อย",
            );
            closeDialog();
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
          }
        });
        break;
      }
      case "reject-red":
        run(() => moderatorRejectRedCard(dialogPayload.card.id, reason), "ยกเลิกใบแดงเรียบร้อย");
        break;
      case "delete-lap":
        run(() => moderatorDeleteLapTime(dialogPayload.lap.id, reason), "ลบ Lap เรียบร้อย");
        break;
      case "delete-finish":
        run(() => moderatorDeleteFinishTime(dialogPayload.finish.id, reason), "ลบเวลาเรียบร้อย");
        break;
      case "edit-lap": {
        const newMs = parseTimeString(timeInput ?? "");
        if (newMs === null) {
          toast.error("รูปแบบเวลาไม่ถูกต้อง");
          return;
        }
        run(() => moderatorEditLapTime(dialogPayload.lap.id, newMs, reason), "แก้ไข Lap เรียบร้อย");
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
      case "edit-finish-position": {
        const pos = Number.parseInt((timeInput ?? "").trim(), 10);
        if (!Number.isInteger(pos) || pos < 1) {
          toast.error("อันดับต้องเป็นจำนวนเต็มตั้งแต่ 1");
          return;
        }
        run(
          () => moderatorEditFinishPosition(dialogPayload.finish.id, pos, reason),
          "แก้ไขอันดับเรียบร้อย",
        );
        break;
      }
    }
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

      <CardEditDialog
        card={cardToEdit}
        judges={props.judges}
        open={cardToEdit !== null}
        onOpenChange={(open) => {
          if (!open) setCardToEdit(null);
        }}
        onConfirm={handleCardEditConfirm}
        isPending={isPending}
      />

      <RoundInfoDialog
        roundInfo={props.roundInfo}
        open={roundInfoOpen}
        onOpenChange={setRoundInfoOpen}
        onConfirm={handleRoundInfoConfirm}
        isPending={isPending}
      />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                แก้ไขข้อมูลรอบการแข่งขัน
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                จัดการรายละเอียดแยกตามหมวด — ทุกการเปลี่ยนแปลงถูกบันทึกใน audit log
              </p>
              <p className="text-xs text-slate-500">{props.eventName}</p>
            </div>
            <Link href={`/admin/events/${props.eventId}/moderator`}>
              <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
                กลับไป Moderator
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

          {/* Round info / timing */}
          {props.roundInfo && (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{props.roundInfo.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>ระยะ {props.roundInfo.distanceKm || "—"} กม.</span>
                    <span>Lap {props.roundInfo.lapCount ?? "—"}</span>
                    <span>เริ่ม {fmtDateTime(props.roundInfo.startedAt)}</span>
                    <span>จบ {fmtDateTime(props.roundInfo.endedAt)}</span>
                    <span className="font-medium text-emerald-700">
                      เวลาที่ใช้ {elapsed(props.roundInfo.startedAt, props.roundInfo.endedAt)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setRoundInfoOpen(true)}
                  className="h-8 shrink-0 rounded-lg text-xs"
                >
                  แก้ไขข้อมูลรอบ / เวลา
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Athlete status */}
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  สถานะนักกีฬา ({props.athletes.length} คน)
                </h2>
                <p className="text-xs text-slate-500">คลิกปุ่มเพื่อ override สถานะ</p>
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
                                onClick={() => {
                                  if (a.status !== s)
                                    openDialog({ kind: "status", athlete: a, newStatus: s });
                                }}
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

          {/* ── Judges accordion ──────────────────────────────────────────────── */}
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-slate-500" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">กรรมการ & ใบที่ออก</h2>
                    <p className="text-xs text-slate-500">กดเพื่อขยายดูใบของกรรมการแต่ละคน</p>
                  </div>
                </div>
              </div>

              {props.judges.length === 0 ? (
                <p className="px-6 py-6 text-center text-xs text-slate-500">ไม่มีกรรมการในรอบนี้</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {props.judges.map((j) => {
                    const myCards = cardsByJudge.get(j.id) ?? [];
                    const yellow = myCards.filter((c) => c.color === "YELLOW").length;
                    const red = myCards.filter(
                      (c) => c.color === "RED" && c.state !== "OVERRIDDEN",
                    ).length;
                    const redOverridden = myCards.filter(
                      (c) => c.color === "RED" && c.state === "OVERRIDDEN",
                    ).length;
                    const expanded = expandedJudges.has(j.id);
                    return (
                      <div key={j.id}>
                        <button
                          type="button"
                          onClick={() => toggleJudge(j.id)}
                          className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{j.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {POSITION_LABEL[j.position]}
                                {j.zone ? ` • ${j.zone}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
                            {yellow > 0 && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                                เหลือง {yellow}
                              </span>
                            )}
                            {red > 0 && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                                แดง {red}
                              </span>
                            )}
                            {yellow === 0 && red === 0 && redOverridden > 0 && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
                                ยกเลิกแล้ว {redOverridden}
                              </span>
                            )}
                            {yellow === 0 && red === 0 && redOverridden === 0 && (
                              <span className="text-slate-400">ไม่มีใบ</span>
                            )}
                          </div>
                        </button>

                        {expanded && (
                          <div className="space-y-2 bg-slate-50/50 px-6 pb-4 pt-1">
                            {myCards.length === 0 ? (
                              <p className="py-2 text-center text-[11px] text-slate-500">
                                กรรมการคนนี้ยังไม่ได้ให้ใบ
                              </p>
                            ) : (
                              myCards.map((c) => {
                                const isYellow = c.color === "YELLOW";
                                const isOverriddenRed =
                                  c.color === "RED" && c.state === "OVERRIDDEN";
                                const st = redStateBadge(c.state);
                                const isPendingRed =
                                  c.color === "RED" && c.state === "PENDING";
                                return (
                                  <div
                                    key={c.id}
                                    className={cn(
                                      "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2",
                                      isYellow
                                        ? "border-amber-200 bg-amber-50/60"
                                        : isOverriddenRed
                                          ? "border-slate-200 bg-slate-50/80"
                                          : "border-red-200 bg-red-50/60",
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        className={cn(
                                          "flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-bold text-white",
                                          isYellow
                                            ? "bg-amber-400"
                                            : isOverriddenRed
                                              ? "bg-slate-400"
                                              : "bg-red-500",
                                        )}
                                      >
                                        {SYMBOL_CHAR[c.symbol]}
                                      </span>
                                      <div>
                                        <p className="text-xs font-medium text-slate-800">
                                          {isYellow ? "ใบเหลือง" : "ใบแดง"} • {SYMBOL_LABEL[c.symbol]}
                                          {st && (
                                            <span
                                              className={cn(
                                                "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                                                st.cls,
                                              )}
                                            >
                                              {st.label}
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                          <span className="font-mono">{c.bib}</span> {c.athleteName} •{" "}
                                          {new Date(c.issuedAt).toLocaleTimeString("th-TH")}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {isPendingRed && (
                                        <>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={() => openDialog({ kind: "confirm-red", card: c })}
                                            className="h-7 rounded-lg border-emerald-300 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
                                          >
                                            ยืนยัน
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={() => openDialog({ kind: "reject-red", card: c })}
                                            className="h-7 rounded-lg border-slate-300 px-2 text-[11px] text-slate-600 hover:bg-slate-100"
                                          >
                                            ยกเลิก
                                          </Button>
                                        </>
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() => setCardToEdit(c)}
                                        className="h-7 rounded-lg px-2 text-[11px]"
                                      >
                                        แก้ไข
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() => openDialog({ kind: "delete-card", card: c })}
                                        className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                                      >
                                        ลบ
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Lap times accordion ───────────────────────────────────────────── */}
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-slate-500" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">เวลา Lap รายนักกีฬา</h2>
                    <p className="text-xs text-slate-500">กดเพื่อขยายดูและแก้เวลาแต่ละรอบ</p>
                  </div>
                </div>
              </div>

              {lapAthletes.length === 0 ? (
                <p className="px-6 py-6 text-center text-xs text-slate-500">
                  ยังไม่มีการบันทึกเวลา Lap ในรอบนี้
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lapAthletes.map((a) => {
                    const laps = lapsByAthlete.get(a.id) ?? [];
                    const expanded = expandedLapAthletes.has(a.id);
                    return (
                      <div key={a.id}>
                        <button
                          type="button"
                          onClick={() => toggleLapAthlete(a.id)}
                          className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                            <p className="text-sm font-medium text-slate-900">
                              <span className="font-mono">{a.bib}</span> · {a.name}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            {laps.length} รอบ
                          </span>
                        </button>

                        {expanded && (
                          <div className="space-y-1.5 bg-slate-50/50 px-6 pb-4 pt-1">
                            {laps.map((l) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 min-w-[3.5rem] items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-600">
                                    รอบ {l.lapNumber}
                                  </span>
                                  <span className="font-mono text-sm text-slate-800">
                                    {formatMs(l.timeMs)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() => openDialog({ kind: "edit-lap", lap: l })}
                                    className="h-7 rounded-lg px-2 text-[11px]"
                                  >
                                    แก้เวลา
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={() => openDialog({ kind: "delete-lap", lap: l })}
                                    className="h-7 rounded-lg border-red-200 px-2 text-[11px] text-red-700 hover:bg-red-50"
                                  >
                                    ลบ
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Finish times (table — keeps the original style) ───────────────── */}
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
                <Flag className="h-4 w-4 text-slate-500" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    เวลาเข้าเส้นชัย ({props.finishes.length} รายการ)
                  </h2>
                  <p className="text-xs text-slate-500">แก้เวลา / อันดับ หรือลบ (ลบแล้วบันทึกใหม่ได้)</p>
                </div>
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
                                onClick={() => openDialog({ kind: "edit-finish", finish: ft })}
                                className="h-7 rounded-lg px-2 text-[11px]"
                              >
                                แก้เวลา
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  openDialog({ kind: "edit-finish-position", finish: ft })
                                }
                                className="h-7 rounded-lg px-2 text-[11px]"
                              >
                                แก้อันดับ
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => openDialog({ kind: "delete-finish", finish: ft })}
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

          {/* ── Activity log timeline ─────────────────────────────────────────── */}
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
                <History className="h-4 w-4 text-slate-500" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    ประวัติการแก้ไข &amp; เหตุการณ์ ({props.logs.length})
                  </h2>
                  <p className="text-xs text-slate-500">บันทึกทุกการแก้ไขและเหตุการณ์ในรอบนี้ (ใหม่สุดบนสุด)</p>
                </div>
              </div>
              {props.logs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                  <ClipboardList className="h-6 w-6 text-slate-300" />
                  <p className="text-xs text-slate-500">ยังไม่มีบันทึกในรอบนี้</p>
                </div>
              ) : (
                <div className="max-h-[440px] divide-y divide-slate-100 overflow-auto">
                  {props.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-6 py-2.5 hover:bg-slate-50/60">
                      <span className="mt-0.5 shrink-0 font-mono text-[11px] text-slate-400">{log.time}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-800">
                          <span className="font-medium text-slate-900">{log.actionLabel}</span>
                          {(log.targetBib || log.targetAthlete) && (
                            <span className="text-slate-600">
                              {" — "}
                              {log.targetBib && <span className="font-mono">{log.targetBib}</span>}
                              {log.targetAthlete ? ` ${log.targetAthlete}` : ""}
                            </span>
                          )}
                        </p>
                        {log.details && <p className="mt-0.5 text-[11px] text-slate-500">{log.details}</p>}
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {log.actorRoleLabel} · {log.actorName} · {log.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

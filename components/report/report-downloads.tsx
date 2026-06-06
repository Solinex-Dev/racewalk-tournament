"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Printer, Users, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReportAgeGroup = { value: number; label: string; count: number };

export type ReportRound = {
  id: string;
  name: string;
  statusLabel: string;
  /** Only FINISHED rounds can be exported. */
  exportable: boolean;
  athleteCount: number;
  finishCount: number;
  elapsedLabel: string | null;
};

type Props = {
  eventId: string;
  ageGroups: ReportAgeGroup[];
  rounds: ReportRound[];
};

function buildHref(
  base: string,
  params: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

/**
 * A download/print button that becomes a non-clickable disabled button when
 * `disabled` (e.g. round not finished). Enabled links use a real <a>/<Link>.
 */
function DownloadAction({
  href,
  external = false,
  disabled = false,
  variant,
  className,
  children,
}: Readonly<{
  href: string;
  external?: boolean;
  disabled?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  children: React.ReactNode;
}>) {
  if (disabled) {
    return (
      <Button type="button" size="sm" variant={variant} disabled className={className}>
        {children}
      </Button>
    );
  }
  const btn = (
    <Button type="button" size="sm" variant={variant} className={className}>
      {children}
    </Button>
  );
  return external ? (
    <Link href={href} target="_blank" rel="noopener">
      {btn}
    </Link>
  ) : (
    <a href={href} download>
      {btn}
    </a>
  );
}

export function ReportDownloads({ eventId, ageGroups, rounds }: Readonly<Props>) {
  const [selected, setSelected] = React.useState<number[]>([]);

  const ageGroupsParam =
    selected.length > 0
      ? [...selected].sort((a, b) => a - b).join(",")
      : undefined;

  const toggle = (value: number) =>
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  // Whole-event exports cover only finished rounds; disabled entirely when none exist.
  const hasExportable = rounds.some((r) => r.exportable);
  const hasUnfinished = rounds.some((r) => !r.exportable);

  const xlsxHref = (roundId?: string) =>
    buildHref(`/api/events/${eventId}/summary-xlsx`, {
      round: roundId,
      ageGroups: ageGroupsParam,
    });
  const summaryPdfHref = (roundId?: string) =>
    buildHref(`/admin/events/${eventId}/report/summary`, {
      round: roundId,
      ageGroups: ageGroupsParam,
    });
  const csvHref = (roundId?: string) =>
    buildHref(`/api/events/${eventId}/export`, {
      round: roundId,
      ageGroups: ageGroupsParam,
    });
  const plainPrintHref = buildHref(`/admin/events/${eventId}/report/print`, {
    ageGroups: ageGroupsParam,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Age-group filter ──────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-500" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">กรองตามรุ่นอายุ</h2>
          </div>
          {ageGroups.length === 0 ? (
            <p className="text-sm italic text-slate-500">
              ยังไม่พบรุ่นอายุจากเลข BIB ของนักกีฬาใน Event นี้
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                เลือกรุ่นอายุที่ต้องการ (เลือกได้หลายรุ่น) — รุ่นอายุอ้างอิงจากเลข
                BIB ของนักกีฬา ถ้าไม่เลือกจะรวมทุกคน
              </p>
              <div className="flex flex-wrap gap-2">
                {ageGroups.map((g) => {
                  const active = selected.includes(g.value);
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => toggle(g.value)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-emerald-300 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span>{g.label} ปี</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[11px] font-semibold",
                          active ? "bg-emerald-500/40" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {g.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selected.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">
                    กำลังกรอง {selected.length} รุ่น —
                    เอกสารและไฟล์ที่ดาวน์โหลดจะมีเฉพาะนักกีฬาในรุ่นที่เลือก
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    <X className="size-3" aria-hidden /> ล้างตัวกรอง
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Official Race Walking Judges Summary Sheet ────────────────────── */}
      <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40">
        <CardContent className="space-y-4 p-6">
          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
              รูปแบบเอกสารการแข่งขัน
            </span>
            <h2 className="mt-2 text-base font-semibold text-slate-900">
              ใบสรุปผลการตัดสินกรรมการ (Race Walking Judges Summary Sheet)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              เอกสารตามรูปแบบมาตรฐานการแข่งขันเดินทน — แสดงใบเหลือง/ใบแดง (~ ยกเท้า, &lt; เข่างอ)
              ของกรรมการแต่ละโซน พร้อมยอดรวม การตัดสิทธิ์ (DQ) และเวลาเข้าเส้นชัย{" "}
              <span className="text-slate-500">— Excel แยกชีตต่อรอบ (1 รอบ = 1 ชีต)</span>
            </p>
          </div>
          {hasExportable ? (
            <>
              <div className="flex flex-wrap gap-2">
                <DownloadAction
                  href={xlsxHref()}
                  className="rounded-lg bg-emerald-700 text-sm hover:bg-emerald-800"
                >
                  <Download className="size-4" aria-hidden />
                  ดาวน์โหลด Excel (.xlsx)
                </DownloadAction>
                <DownloadAction
                  href={summaryPdfHref()}
                  external
                  variant="outline"
                  className="rounded-lg border-emerald-300 text-sm"
                >
                  <Printer className="size-4" aria-hidden />
                  พิมพ์ / บันทึก PDF
                </DownloadAction>
              </div>
              {hasUnfinished && (
                <p className="text-xs text-slate-500">
                  * รวมเฉพาะรอบที่แข่งเสร็จแล้ว — รอบที่ยังแข่งไม่เสร็จจะไม่ถูกนำมาออกรายงาน
                </p>
              )}
            </>
          ) : (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
              <Lock className="size-4" aria-hidden />
              ยังไม่มีรอบที่แข่งเสร็จ — ยังออกรายงานไม่ได้
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Per-round downloads ───────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">รายรอบ</h2>
            <p className="mt-1 text-sm text-slate-600">
              ดาวน์โหลดเฉพาะรอบที่ต้องการ — เฉพาะรอบที่แข่งเสร็จแล้วเท่านั้น
            </p>
          </div>

          {rounds.length === 0 ? (
            <p className="text-sm italic text-slate-500">Event นี้ยังไม่มีรอบ</p>
          ) : (
            <div className="space-y-2">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">{round.name}</p>
                    <p className="text-xs text-slate-600">
                      {round.statusLabel} • {round.athleteCount} นักกีฬา •{" "}
                      {round.finishCount} เข้าเส้นชัย
                      {round.elapsedLabel && <> • เวลา {round.elapsedLabel}</>}
                    </p>
                  </div>
                  {round.exportable ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <DownloadAction href={xlsxHref(round.id)} variant="outline" className="rounded-lg text-xs">
                        <Download className="size-3.5" aria-hidden />
                        Excel
                      </DownloadAction>
                      <DownloadAction href={summaryPdfHref(round.id)} external variant="outline" className="rounded-lg text-xs">
                        <Printer className="size-3.5" aria-hidden />
                        PDF
                      </DownloadAction>
                      <DownloadAction href={csvHref(round.id)} variant="ghost" className="rounded-lg text-xs text-slate-500">
                        CSV
                      </DownloadAction>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                      <Lock className="size-3" aria-hidden />
                      ยังแข่งไม่เสร็จ
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Plain results table (simple CSV / print) ──────────────────────── */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">ตารางผลแบบย่อ (CSV)</h2>
            <p className="mt-1 text-sm text-slate-600">
              สรุปผลรวมทุกรอบแบบตารางอย่างง่าย เหมาะกับการเปิดใน Excel หรือเก็บเป็นบันทึก
            </p>
          </div>
          {hasExportable ? (
            <>
              <div className="flex flex-wrap gap-2">
                <DownloadAction href={csvHref()} variant="outline" className="rounded-lg text-sm">
                  <Download className="size-4" aria-hidden />
                  ดาวน์โหลด CSV (รวมทุกรอบ)
                </DownloadAction>
                <DownloadAction href={plainPrintHref} external variant="ghost" className="rounded-lg text-sm text-slate-500">
                  <Printer className="size-4" aria-hidden />
                  พิมพ์ตารางย่อ
                </DownloadAction>
              </div>
              {hasUnfinished && (
                <p className="text-xs text-slate-500">
                  * รวมเฉพาะรอบที่แข่งเสร็จแล้ว
                </p>
              )}
            </>
          ) : (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
              <Lock className="size-4" aria-hidden />
              ยังไม่มีรอบที่แข่งเสร็จ — ยังออกรายงานไม่ได้
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, FileDown } from "lucide-react";
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
import {
  previewAthleteImport,
  commitAthleteImport,
  previewJudgeImport,
  commitJudgeImport,
  previewAffiliationImport,
  commitAffiliationImport,
} from "@/app/actions/csv-import";
import { CSV_HEADERS } from "@/lib/csv/import-types";
import type { ImportEntity, ImportPreview, PreviewRow, RowVerdict } from "@/lib/csv/import-types";

/**
 * Default row selection: keep updates + non-duplicate creates; for an in-file
 * duplicate group keep only the first; skip rows that duplicate an existing record
 * and rows with errors. The operator can freely re-tick anything.
 */
function defaultSelection(pv: ImportPreview): Set<number> {
  const s = new Set<number>();
  for (const r of pv.rows) {
    if (r.verdict === "error") continue;
    if (r.verdict === "update" || !r.dup) {
      s.add(r.rowNumber);
      continue;
    }
    if (r.dup.kind === "file" && r.dup.group === r.rowNumber) s.add(r.rowNumber);
  }
  return s;
}

function dupText(r: PreviewRow): string | null {
  if (!r.dup) return null;
  return r.dup.kind === "db" ? "ซ้ำกับข้อมูลเดิมในระบบ" : `ซ้ำในไฟล์ (กับแถว ${r.dup.group})`;
}

const ACTIONS = {
  athlete: { preview: previewAthleteImport, commit: commitAthleteImport },
  judge: { preview: previewJudgeImport, commit: commitJudgeImport },
  affiliation: { preview: previewAffiliationImport, commit: commitAffiliationImport },
} as const;

const ENTITY_LABEL: Record<ImportEntity, string> = {
  athlete: "นักกีฬา",
  judge: "กรรมการ",
  affiliation: "สังกัด",
};

const VERDICT_META: Record<RowVerdict, { label: string; cls: string }> = {
  create: { label: "เพิ่มใหม่", cls: "bg-emerald-100 text-emerald-700" },
  update: { label: "อัปเดต", cls: "bg-sky-100 text-sky-700" },
  error: { label: "ผิดพลาด", cls: "bg-red-100 text-red-700" },
};

export function CsvImportDialog({
  entity,
  open,
  onOpenChange,
}: Readonly<{ entity: ImportEntity; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [included, setIncluded] = React.useState<Set<number>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setIncluded(new Set());
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  const runPreview = (f: File) => {
    setFile(f);
    setPreview(null);
    const fd = new FormData();
    fd.append("file", f);
    startTransition(async () => {
      try {
        const pv = await ACTIONS[entity].preview(fd);
        setPreview(pv);
        setIncluded(defaultSelection(pv));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "อ่านไฟล์ไม่สำเร็จ");
      }
    });
  };

  const toggle = (rowNumber: number) =>
    setIncluded((prev) => {
      const n = new Set(prev);
      if (n.has(rowNumber)) n.delete(rowNumber);
      else n.add(rowNumber);
      return n;
    });
  const selectableRows = (preview?.rows ?? []).filter((r) => r.verdict !== "error");
  const selectAll = () => setIncluded(new Set(selectableRows.map((r) => r.rowNumber)));
  const resetDefault = () => preview && setIncluded(defaultSelection(preview));

  const downloadTemplate = () => {
    const csv = "﻿" + CSV_HEADERS[entity].join(",") + "\r\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity}-template.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onConfirm = () => {
    if (!file || !preview) return;
    const excluded = preview.rows.filter((r) => !included.has(r.rowNumber)).map((r) => r.rowNumber);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        const res = await ACTIONS[entity].commit(fd, excluded);
        toast.success(`นำเข้าสำเร็จ — เพิ่ม ${res.created} • อัปเดต ${res.updated}`);
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
      }
    });
  };

  const counts = preview?.counts;
  const dupCount = (preview?.rows ?? []).filter((r) => r.dup).length;
  const canConfirm = !!preview && !preview.topError && (counts?.error ?? 0) === 0 && included.size > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-left text-slate-900">นำเข้า{ENTITY_LABEL[entity]}จาก CSV</DialogTitle>
          <DialogDescription asChild>
            <p className="text-left text-sm text-slate-600">
              เลือกไฟล์ CSV (รูปแบบเดียวกับที่ Export) — ระบบจะตรวจสอบและแสดงผลก่อนยืนยัน
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) runPreview(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg"
            >
              <FileText className="h-4 w-4" /> เลือกไฟล์ CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="rounded-lg text-slate-500"
            >
              <FileDown className="h-4 w-4" /> ดาวน์โหลด Template
            </Button>
            {file && <span className="truncate text-xs text-slate-500">{file.name}</span>}
            {pending && <span className="text-xs text-slate-400">กำลังประมวลผล…</span>}
          </div>

          {preview?.topError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{preview.topError}</p>
          )}

          {preview && !preview.topError && counts && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge cls="bg-emerald-100 text-emerald-700" n={counts.create} label="เพิ่มใหม่" />
                <Badge cls="bg-sky-100 text-sky-700" n={counts.update} label="อัปเดต" />
                <Badge cls="bg-red-100 text-red-700" n={counts.error} label="ผิดพลาด" />
                {dupCount > 0 && <Badge cls="bg-amber-100 text-amber-700" n={dupCount} label="ซ้ำ" />}
                <span className="ml-auto rounded-full bg-slate-900 px-2.5 py-1 font-medium text-white">
                  จะนำเข้าจริง {included.size}
                </span>
              </div>

              {counts.error > 0 && (
                <p className="text-xs text-red-600">
                  มี {counts.error} แถวที่ผิดพลาด — ต้องแก้ไขให้ครบก่อนจึงจะยืนยันได้
                </p>
              )}

              {dupCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span>พบข้อมูลซ้ำ — ติ๊กเลือกได้อิสระว่าจะนำเข้าแถวไหน:</span>
                  <Button type="button" variant="outline" size="sm" className="h-6 rounded-md px-2 text-[11px]" onClick={resetDefault}>
                    เก็บอันละ 1
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-6 rounded-md px-2 text-[11px]" onClick={selectAll}>
                    เลือกทุกแถว
                  </Button>
                </div>
              )}

              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="w-10 px-3 py-2 text-center">เลือก</th>
                      <th className="px-3 py-2 text-left">แถว</th>
                      <th className="px-3 py-2 text-left">สถานะ</th>
                      <th className="px-3 py-2 text-left">รายการ</th>
                      <th className="px-3 py-2 text-left">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.rows.map((r) => {
                      const notes = [dupText(r), ...r.reasons].filter(Boolean).join(" · ");
                      const rowCls = r.verdict === "error" ? "bg-red-50/40" : r.dup ? "bg-amber-50/40" : "";
                      return (
                        <tr key={r.rowNumber} className={rowCls}>
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-slate-900 disabled:opacity-40"
                              checked={included.has(r.rowNumber)}
                              disabled={r.verdict === "error"}
                              onChange={() => toggle(r.rowNumber)}
                              aria-label={`เลือกแถว ${r.rowNumber}`}
                            />
                          </td>
                          <td className="px-3 py-1.5 font-mono text-slate-500">{r.rowNumber}</td>
                          <td className="px-3 py-1.5">
                            <span className={cn("rounded-full px-2 py-0.5 font-medium", VERDICT_META[r.verdict].cls)}>
                              {VERDICT_META[r.verdict].label}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-800">{r.label}</td>
                          <td className="px-3 py-1.5 text-slate-500">{notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {preview.dupGroups && preview.dupGroups.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-700">
                    รายละเอียดข้อมูลซ้ำ ({preview.dupGroups.length} กลุ่ม)
                  </p>
                  <div className="max-h-60 overflow-auto rounded-xl border border-amber-200 bg-amber-50/30">
                    <table className="min-w-full text-xs">
                      <thead className="sticky top-0 border-b border-amber-200 bg-amber-50 text-[11px] uppercase text-amber-700">
                        <tr>
                          <th className="px-3 py-2 text-left">ชนิด</th>
                          <th className="px-3 py-2 text-left">ข้อมูลเดิมในระบบ</th>
                          <th className="px-3 py-2 text-left">ที่กำลังจะเพิ่ม (แถวในไฟล์)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {preview.dupGroups.map((g, gi) => (
                          <tr key={gi} className="align-top">
                            <td className="px-3 py-1.5 text-nowrap">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 font-medium",
                                  g.kind === "db"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {g.kind === "db" ? "ซ้ำกับระบบ" : "ซ้ำในไฟล์"}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-slate-700">
                              {g.existingLabel ?? <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-3 py-1.5 text-slate-700">
                              {g.incoming.map((r) => (
                                <span
                                  key={r.rowNumber}
                                  className={cn(
                                    "mr-1 mb-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
                                    included.has(r.rowNumber)
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-400 line-through",
                                  )}
                                >
                                  <span className="font-mono">#{r.rowNumber}</span> {r.label}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    เขียวตัวหนา = จะถูกนำเข้า • เทาขีดฆ่า = ถูกข้าม (ปรับได้จากช่องติ๊กในตารางด้านบน)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="rounded-xl border-slate-200" disabled={pending} onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button type="button" className="rounded-xl" disabled={!canConfirm} onClick={onConfirm}>
            <Upload className="h-4 w-4" />
            {pending ? "กำลังนำเข้า…" : "ยืนยันนำเข้า"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Badge({ cls, n, label }: Readonly<{ cls: string; n: number; label: string }>) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium", cls)}>
      <strong>{n}</strong> {label}
    </span>
  );
}

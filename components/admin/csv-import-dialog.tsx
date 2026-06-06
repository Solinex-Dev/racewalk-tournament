"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
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
import type { ImportEntity, ImportPreview, RowVerdict } from "@/lib/csv/import-types";

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
  const [pending, startTransition] = React.useTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
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
        setPreview(await ACTIONS[entity].preview(fd));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "อ่านไฟล์ไม่สำเร็จ");
      }
    });
  };

  const onConfirm = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        const res = await ACTIONS[entity].commit(fd);
        toast.success(`นำเข้าสำเร็จ — เพิ่ม ${res.created} • อัปเดต ${res.updated}`);
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
      }
    });
  };

  const counts = preview?.counts;
  const canConfirm = !!preview && !preview.topError && (counts?.error ?? 0) === 0 && (counts?.total ?? 0) > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left text-slate-900">นำเข้า{ENTITY_LABEL[entity]}จาก CSV</DialogTitle>
          <DialogDescription asChild>
            <p className="text-left text-sm text-slate-600">
              เลือกไฟล์ CSV (รูปแบบเดียวกับที่ Export) — ระบบจะตรวจสอบและแสดงผลก่อนยืนยัน •
              แถวที่มี <span className="font-mono">id</span> = อัปเดต, ว่าง = เพิ่มใหม่
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
          <div className="flex items-center gap-2">
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
            {file && <span className="truncate text-xs text-slate-500">{file.name}</span>}
            {pending && <span className="text-xs text-slate-400">กำลังประมวลผล…</span>}
          </div>

          {preview?.topError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{preview.topError}</p>
          )}

          {preview && !preview.topError && counts && (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge cls="bg-emerald-100 text-emerald-700" n={counts.create} label="เพิ่มใหม่" />
                <Badge cls="bg-sky-100 text-sky-700" n={counts.update} label="อัปเดต" />
                <Badge cls="bg-red-100 text-red-700" n={counts.error} label="ผิดพลาด" />
                <Badge cls="bg-slate-100 text-slate-600" n={counts.total} label="ทั้งหมด" />
              </div>
              {counts.error > 0 && (
                <p className="text-xs text-red-600">
                  มี {counts.error} แถวที่ผิดพลาด — ต้องแก้ไขให้ครบก่อนจึงจะยืนยันได้ (นำเข้าแบบทั้งหมดหรือไม่นำเข้าเลย)
                </p>
              )}
              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">แถว</th>
                      <th className="px-3 py-2 text-left">สถานะ</th>
                      <th className="px-3 py-2 text-left">รายการ</th>
                      <th className="px-3 py-2 text-left">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.rows.map((r) => (
                      <tr key={r.rowNumber} className={r.verdict === "error" ? "bg-red-50/40" : ""}>
                        <td className="px-3 py-1.5 font-mono text-slate-500">{r.rowNumber}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 font-medium", VERDICT_META[r.verdict].cls)}>
                            {VERDICT_META[r.verdict].label}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-800">{r.label}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.reasons.join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

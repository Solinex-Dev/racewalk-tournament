"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ImportResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: string[];
};

type Props = {
  label?: string;
  hint: string;
  /** Server action that accepts CSV text and returns ImportResult */
  importAction: (csv: string) => Promise<ImportResult>;
};

export function CsvImportButton({ label = "Import CSV", hint, importAction }: Props) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const csv = String(reader.result ?? "");
      startTransition(async () => {
        try {
          const result = await importAction(csv);
          if (result.ok) {
            toast.success(`นำเข้า ${result.imported} รายการสำเร็จ${result.skipped > 0 ? ` (ข้าม ${result.skipped})` : ""}`);
            if (result.errors.length > 0) {
              toast.warning(`มีบางแถวผิดพลาด: ${result.errors.slice(0, 3).join(" / ")}`);
            }
            router.refresh();
          } else {
            toast.error(`นำเข้าไม่สำเร็จ: ${result.errors.join(" / ") || "ไม่มีข้อมูลที่ถูกต้อง"}`);
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        }
      });
    };
    reader.onerror = () => toast.error("อ่านไฟล์ไม่สำเร็จ");
    reader.readAsText(file, "utf-8");

    // Reset so picking same file again triggers onChange
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-slate-200 text-xs"
      >
        {isPending ? "กำลังนำเข้า..." : `⬆ ${label}`}
      </Button>
      <p className="text-[10px] text-slate-500">{hint}</p>
    </div>
  );
}

import { Clock, UserRound } from "lucide-react";
import type { AuditMeta } from "@/lib/audit";

function fmt(dt: Date | null): string {
  if (!dt) return "—";
  return dt.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Read-only "created by / last edited by" footer for a detail page. */
export function AuditInfo({ createdByName, createdAt, updatedByName, updatedAt }: AuditMeta) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="h-3.5 w-3.5 text-slate-400" />
        สร้างโดย{" "}
        <span className="font-medium text-slate-800">{createdByName || "— (ข้อมูลตั้งต้น)"}</span>
        <span className="text-slate-400">• {fmt(createdAt)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        แก้ล่าสุดโดย <span className="font-medium text-slate-800">{updatedByName || "—"}</span>
        <span className="text-slate-400">• {fmt(updatedAt)}</span>
      </span>
    </div>
  );
}

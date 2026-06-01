"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      className="no-print inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden />
      พิมพ์ / Save as PDF
    </button>
  );
}

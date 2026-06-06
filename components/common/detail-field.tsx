import * as React from "react";

/** One label → value row for the read-only (display) view of a detail page. */
export function DetailField({ label, value }: Readonly<{ label: string; value?: React.ReactNode }>) {
  const isEmpty =
    value === null || value === undefined || value === "" || value === false;
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-44 shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">
        {isEmpty ? <span className="text-slate-400">—</span> : value}
      </dd>
    </div>
  );
}

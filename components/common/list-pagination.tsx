"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Client-side search + pagination for long in-page lists (moderator athlete /
 * judge / lap / finish sections). Keeps the whole dataset in memory and slices a
 * page out of the filtered set — fine for the few-hundred-row scale these screens
 * deal with. Changing the query resets to page 1; `page` is always clamped to a
 * valid range so a shrinking list never strands you on an empty page.
 */
export function usePaginatedList<T>(
  items: T[],
  match: (item: T, q: string) => boolean,
  pageSize = 20,
) {
  const [query, setQueryRaw] = React.useState("");
  const [page, setPage] = React.useState(0);

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((it) => match(it, q)) : items;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const setQuery = (v: string) => {
    setQueryRaw(v);
    setPage(0);
  };

  return {
    query,
    setQuery,
    page: safePage,
    setPage,
    totalPages,
    total: items.length,
    filteredTotal: filtered.length,
    pageItems,
    rangeStart: filtered.length === 0 ? 0 : start + 1,
    rangeEnd: Math.min(filtered.length, start + pageSize),
    isFiltered: q !== "",
  };
}

export function ListSearch({
  value,
  onChange,
  placeholder = "ค้นหา...",
  className,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}>) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 text-xs"
      />
    </div>
  );
}

export function ListPager({
  page,
  totalPages,
  onPage,
  rangeStart,
  rangeEnd,
  filteredTotal,
  total,
  isFiltered,
  unit = "รายการ",
}: Readonly<{
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  rangeStart: number;
  rangeEnd: number;
  filteredTotal: number;
  total: number;
  isFiltered: boolean;
  unit?: string;
}>) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
      <span>
        แสดง {rangeStart}–{rangeEnd} จาก {filteredTotal} {unit}
        {isFiltered ? ` (กรองจากทั้งหมด ${total})` : ""}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => onPage(page - 1)}
            className="h-7 rounded-lg px-2 text-[11px]"
          >
            ก่อนหน้า
          </Button>
          <span>
            หน้า {page + 1}/{totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPage(page + 1)}
            className="h-7 rounded-lg px-2 text-[11px]"
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}

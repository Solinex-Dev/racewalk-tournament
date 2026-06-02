"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

type ListFiltersPanelProps = {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  children: ReactNode;
};

/** Collapsible search/filter bar (matches /admin/events list UX). */
export function ListFiltersPanel({
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
  children,
}: ListFiltersPanelProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Collapsible
      open={filtersOpen}
      onOpenChange={setFiltersOpen}
      className="space-y-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative h-8 shrink-0 gap-1 rounded-lg border-slate-200 px-2.5 text-xs font-medium text-slate-700 shadow-none"
            aria-expanded={filtersOpen}
            aria-label="ค้นหาและกรองขั้นสูง"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>กรอง</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 opacity-50 transition-transform",
                filtersOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
            {hasActiveFilters && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
                aria-hidden="true"
              />
            )}
          </Button>
        </CollapsibleTrigger>
        <p className="text-xs text-slate-500">
          แสดง {filteredCount} จาก {totalCount} รายการ
        </p>
      </div>

      <CollapsibleContent>
        <Card className="max-w-full rounded-xl border-slate-200 shadow-sm">
          <CardContent className="space-y-2.5 p-3">
            {children}
            {hasActiveFilters && onClearFilters && (
              <div className="flex justify-end pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-7 rounded-lg px-2 text-[11px]"
                >
                  ล้างตัวกรอง
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

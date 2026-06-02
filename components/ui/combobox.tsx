"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Extra strings (English name, code, …) the search should match on. */
  keywords?: string[];
};

export type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** Show a "ไม่ระบุ" entry that clears the value. */
  clearable?: boolean;
  clearLabel?: string;
  /** Allow selecting a typed value not in the list (e.g. a custom prefix). */
  creatable?: boolean;
  /** Pinned bottom action, e.g. open a "create new judge" dialog. */
  onCreateNew?: () => void;
  createNewLabel?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  id,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyText = "ไม่พบรายการ",
  disabled,
  className,
  clearable,
  clearLabel = "ไม่ระบุ",
  creatable,
  onCreateNew,
  createNewLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((o) => o.value === value);
  const hasValue = Boolean(value);
  const triggerLabel = selected ? selected.label : hasValue ? value : placeholder;

  const trimmed = query.trim();
  const exactExists = options.some((o) => o.value === trimmed || o.label === trimmed);

  const select = (v: string) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
            !hasValue && "text-slate-400",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0"
        align="start"
      >
        <Command
          filter={(itemValue, search, keywords) => {
            const hay = `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {clearable && (
                <CommandItem value="ไม่ระบุ" onSelect={() => select("")}>
                  <Check className={cn("h-4 w-4", hasValue ? "opacity-0" : "opacity-100")} />
                  <span className="text-slate-500">{clearLabel}</span>
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  keywords={o.keywords}
                  onSelect={() => select(o.value)}
                >
                  <Check
                    className={cn("h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
              {creatable && trimmed.length > 0 && !exactExists && (
                <CommandItem
                  value={`สร้าง ${trimmed}`}
                  keywords={[trimmed]}
                  onSelect={() => select(trimmed)}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    ใช้ “{trimmed}”
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
            {onCreateNew && (
              <div className="border-t border-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4" />
                  {createNewLabel ?? "สร้างใหม่"}
                </button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

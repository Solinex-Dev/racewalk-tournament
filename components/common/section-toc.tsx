"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; label: string };

/**
 * Sticky left-hand table of contents. Clicking an item smooth-scrolls to the
 * section (id) inside the scrollable <main>; a scroll-spy highlights the section
 * currently near the top of the viewport.
 *
 * Pass a STABLE `items` reference (module const / useMemo) — it's an effect dep.
 */
export function SectionToc({ items, className }: { items: TocItem[]; className?: string }) {
  const [active, setActive] = React.useState<string | null>(items[0]?.id ?? null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: 0 },
    );
    const els = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <nav className={cn("space-y-0.5", className)} aria-label="สารบัญ">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        เนื้อหา
      </p>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => scrollTo(it.id)}
          className={cn(
            "block w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors",
            active === it.id
              ? "font-bold border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}

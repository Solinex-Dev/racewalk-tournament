"use client";

import * as React from "react";

/**
 * "About Racewalk" accordion with an animated expand/collapse.
 *
 * Native <details> can't transition height, so this uses the grid-rows trick:
 * the content wrapper animates `grid-template-rows` from 0fr → 1fr (with an inner
 * overflow-hidden), which smoothly animates to the content's natural height
 * without hard-coding a max-height — and works across browsers.
 */
export function AboutAccordion() {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="mt-12">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 shadow-lg shadow-slate-900/60">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
              เกี่ยวกับการแข่งขันเดินทน (Racewalk)
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              ทำความรู้จักกีฬาเดินทนและกติกาหลักโดยย่อ
            </p>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`space-y-4 border-t border-slate-800 p-5 transition-opacity duration-300 sm:p-6 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-slate-50">Racewalk คืออะไร</h3>
                <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  การแข่งขันเดินทน (Racewalk) เป็นกีฬากรีฑาประเภทเดินที่มีกติกาชัดเจนเรื่องการ
                  “เดินไม่วิ่ง” โดยนักกีฬาต้องรักษาเทคนิคการเดินที่ถูกต้องตลอดระยะทาง
                  หากผิดกติกาจะถูกกรรมการให้ใบเตือนและอาจถูกตัดสิทธิ์ได้
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <h3 className="text-sm font-semibold text-amber-300">การสัมผัสพื้น (Loss of contact)</h3>
                  <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                    ต้องมีเท้าข้างหนึ่งสัมผัสพื้นตลอดเวลาตามสายตากรรมการ ห้ามลอยตัวทั้งสองเท้าพร้อมกัน
                  </p>
                </div>
                <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <h3 className="text-sm font-semibold text-amber-300">เข่าเหยียดตรง (Bent knee)</h3>
                  <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                    ขาที่ก้าวไปข้างหน้าต้องเหยียดตรง (ไม่งอเข่า) ตั้งแต่เท้าแตะพื้นจนผ่านแนวดิ่งของลำตัว
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

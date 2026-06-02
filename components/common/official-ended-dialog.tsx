"use client";

import { useTransition } from "react";
import { FlagTriangleRight, Loader2 } from "lucide-react";
import { leaveOfficialSession } from "@/app/actions/official-session";

/**
 * Non-dismissible modal shown on a race-day official's workspace when their round
 * has finished. The only action is "ยืนยัน" → ends the official session and
 * redirects to the public Live page. Styled for the dark official theme.
 *
 * `open` is driven by the server (round.status === "FINISHED"); the workspace
 * polls (AutoRefresh), so this appears automatically once the round ends.
 */
export function OfficialEndedDialog({
  open,
  roundName,
  roleLabel = "เจ้าหน้าที่",
}: {
  open: boolean;
  roundName?: string;
  roleLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="race-ended-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <FlagTriangleRight className="h-7 w-7" aria-hidden />
        </div>

        <h2 id="race-ended-title" className="text-xl font-bold text-white">
          การแข่งขันจบแล้ว
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {roundName ? (
            <>
              รอบ <span className="font-semibold text-white">{roundName}</span> ได้สิ้นสุดลงแล้ว
            </>
          ) : (
            "การแข่งขันได้สิ้นสุดลงแล้ว"
          )}{" "}
          ระบบจะออกจากระบบ{roleLabel}และพากลับไปยังหน้าถ่ายทอดสด
        </p>

        <p className="mt-2 text-xs text-slate-500">
          ข้อมูลการตัดสินทั้งหมดถูกบันทึกเรียบร้อยแล้ว
        </p>

        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => leaveOfficialSession())}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              กำลังออกจากระบบ…
            </>
          ) : (
            "ยืนยัน — กลับสู่หน้าถ่ายทอดสด"
          )}
        </button>
      </div>
    </div>
  );
}

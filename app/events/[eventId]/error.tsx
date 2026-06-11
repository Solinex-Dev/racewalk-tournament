"use client";

import { useEffect } from "react";

/**
 * Error boundary for the public live scoreboard.
 *
 * The board's initial server render reads the DB (getCachedLeaderboard). A
 * transient DB connection blip — a pool/socket timeout on a cold serverless
 * instance — makes that render throw. Without this boundary the viewer hit
 * Next's generic "This page couldn't load" screen and had to reload by hand.
 *
 * Instead we auto-retry: re-rendering the segment almost always lands on a warm
 * connection and succeeds within a few seconds. The client <LiveBoard> poll is
 * already blip-tolerant once the page is up — this only covers the first render.
 */
export default function EventLiveError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    const id = setTimeout(() => reset(), 4000);
    return () => clearTimeout(id);
  }, [reset]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-200">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-slate-200"
        aria-hidden
      />
      <h1 className="text-lg font-semibold">กำลังเชื่อมต่อกระดานคะแนนสด…</h1>
      <p className="max-w-sm text-sm text-slate-400">
        ระบบกำลังพยายามโหลดข้อมูลใหม่อัตโนมัติ
        หากไม่ขึ้นภายในไม่กี่วินาที กดปุ่มด้านล่างเพื่อลองอีกครั้ง
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-white"
      >
        ลองใหม่
      </button>
    </main>
  );
}

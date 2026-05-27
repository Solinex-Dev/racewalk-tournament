"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Live "updated X seconds ago" indicator.
 * Receives a server-side timestamp via prop — every page refresh
 * (manual or via AutoRefresh) resets the counter.
 *
 * Uses useSyncExternalStore so React reads Date.now() outside of the
 * render path (avoids react-hooks/purity + set-state-in-effect lint rules).
 */
export function LastUpdated({
  time,
  className,
  prefix = "อัพเดทล่าสุด",
}: {
  time: string;
  className?: string;
  prefix?: string;
}) {
  const refreshMs = new Date(time).getTime();

  const subscribe = useCallback((callback: () => void) => {
    const id = setInterval(callback, 1000);
    return () => clearInterval(id);
  }, []);

  const getSnapshot = useCallback(() => Date.now(), []);
  const getServerSnapshot = useCallback(() => refreshMs, [refreshMs]);

  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const secondsAgo = Math.max(0, Math.floor((now - refreshMs) / 1000));

  let label: string;
  if (secondsAgo < 2) label = "เมื่อสักครู่";
  else if (secondsAgo < 60) label = `${secondsAgo} วินาทีที่แล้ว`;
  else if (secondsAgo < 3600) label = `${Math.floor(secondsAgo / 60)} นาทีที่แล้ว`;
  else label = `${Math.floor(secondsAgo / 3600)} ชั่วโมงที่แล้ว`;

  // Color pulse: green if fresh, amber if getting stale, red if very stale
  const dotColor =
    secondsAgo < 7
      ? "bg-emerald-400 animate-pulse"
      : secondsAgo < 15
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} aria-hidden />
      <span className="text-[11px] text-slate-400">
        {prefix}: {label}
      </span>
    </span>
  );
}

"use client";

import { useCallback, useSyncExternalStore } from "react";

function formatMs(ms: number): string {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Live race timer — ticks every second while running, frozen when endedAt is set.
 * Uses useSyncExternalStore so React reads Date.now() outside the render path
 * (avoiding the impure-function-in-render and setState-in-effect lint rules).
 */
export function LiveTimer({
  startedAt,
  endedAt,
  className,
}: Readonly<{
  startedAt: string;
  endedAt: string | null;
  className?: string;
}>) {
  const start = new Date(startedAt).getTime();
  const fixedEnd = endedAt ? new Date(endedAt).getTime() : null;

  const subscribe = useCallback(
    (callback: () => void) => {
      if (fixedEnd !== null) return () => {};
      const id = setInterval(callback, 1000);
      return () => clearInterval(id);
    },
    [fixedEnd],
  );

  const getSnapshot = useCallback(
    () => (fixedEnd ?? Date.now()) - start,
    [fixedEnd, start],
  );

  const getServerSnapshot = useCallback(
    () => (fixedEnd ?? start) - start,
    [fixedEnd, start],
  );

  const elapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <span className={className}>{formatMs(elapsed)}</span>;
}

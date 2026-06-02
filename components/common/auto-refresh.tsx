"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls server data by calling router.refresh() on an interval.
 * Drop into any page that needs near-real-time updates.
 * Renders nothing — just runs the side effect.
 */
export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, router]);
  return null;
}

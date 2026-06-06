"use client";

/**
 * Fires a page-view beacon to /api/admin/track-view whenever the admin navigates
 * to a new route. Because it triggers on a real pathname change (not on link
 * prefetch), it captures actual visits without the prefetch noise. Mounted once
 * in the admin layout.
 */
import * as React from "react";
import { usePathname } from "next/navigation";

export function ActivityTracker() {
  const pathname = usePathname();
  const lastRef = React.useRef<string>("");

  React.useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    const full = globalThis.location.pathname + globalThis.location.search;
    // Dedupe identical consecutive views (also guards React's dev double-effect).
    if (lastRef.current === full) return;
    lastRef.current = full;

    fetch("/api/admin/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: full, title: document.title }),
      keepalive: true,
    }).catch(() => {
      // best-effort; never disrupt the user
    });
  }, [pathname]);

  return null;
}

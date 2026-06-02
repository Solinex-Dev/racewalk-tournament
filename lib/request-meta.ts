/**
 * Extracts request metadata (client IP, User-Agent, referring path) from the
 * current request headers. Safe to call from Server Actions, Route Handlers and
 * Server Components (anywhere `next/headers` works). Returns nulls if unavailable.
 */
import { headers } from "next/headers";

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
  /** The path the request came from (derived from the Referer header). */
  path: string | null;
};

/** First public IP from x-forwarded-for, falling back to common proxy headers. */
function pickIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || null;
}

/** Reduce a full URL (Referer) to just its path + query, for compact storage. */
function refererToPath(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return referer.slice(0, 512);
  }
}

export async function getRequestMeta(): Promise<RequestMeta> {
  try {
    const h = await headers();
    return {
      ipAddress: pickIp(h),
      userAgent: h.get("user-agent"),
      path: refererToPath(h.get("referer")),
    };
  } catch {
    return { ipAddress: null, userAgent: null, path: null };
  }
}

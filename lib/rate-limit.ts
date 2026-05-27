/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-process Next.js dev/prod; for multi-instance prod,
 * swap to Redis-backed implementation.
 */

const buckets = new Map<string, number[]>();

/**
 * Returns true if the request is allowed.
 * Records the timestamp on success.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = buckets.get(key) ?? [];
  // Drop timestamps outside the window
  const fresh = arr.filter((t) => now - t < windowMs);
  if (fresh.length >= max) {
    buckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

/**
 * Periodically prune empty buckets to avoid unbounded memory growth.
 * Called lazily on each invocation.
 */
let lastPrune = 0;
const PRUNE_INTERVAL_MS = 60_000;

export function maybePruneRateLimit(windowMs: number): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [k, v] of buckets.entries()) {
    const fresh = v.filter((t) => now - t < windowMs);
    if (fresh.length === 0) {
      buckets.delete(k);
    } else if (fresh.length < v.length) {
      buckets.set(k, fresh);
    }
  }
}

import { describe, it, expect } from "vitest";
import { checkRateLimit, maybePruneRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to `max` hits then blocks within the window", () => {
    const key = "rl-allow";
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false); // 4th over the limit
  });
  it("keeps separate buckets per key", () => {
    expect(checkRateLimit("rl-a", 1, 60_000)).toBe(true);
    expect(checkRateLimit("rl-b", 1, 60_000)).toBe(true);
    expect(checkRateLimit("rl-a", 1, 60_000)).toBe(false);
  });
  it("treats hits outside the window as expired", () => {
    const key = "rl-window";
    // window of 0ms → previous hit is always already outside the window
    expect(checkRateLimit(key, 1, 0)).toBe(true);
    expect(checkRateLimit(key, 1, 0)).toBe(true);
  });
});

describe("maybePruneRateLimit", () => {
  it("runs without throwing", () => {
    expect(() => maybePruneRateLimit(60_000)).not.toThrow();
  });
});

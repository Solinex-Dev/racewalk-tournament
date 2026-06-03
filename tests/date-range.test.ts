import { describe, it, expect } from "vitest";
import { sinceDaysAgo } from "@/lib/date-range";

describe("sinceDaysAgo", () => {
  it("returns a Date roughly N days before now", () => {
    const before = Date.now();
    const diff = before - sinceDaysAgo(7).getTime();
    expect(diff).toBeGreaterThanOrEqual(7 * 86_400_000 - 2000);
    expect(diff).toBeLessThanOrEqual(7 * 86_400_000 + 2000);
  });
  it("returns approximately now for 0 days", () => {
    expect(Math.abs(Date.now() - sinceDaysAgo(0).getTime())).toBeLessThan(2000);
  });
});

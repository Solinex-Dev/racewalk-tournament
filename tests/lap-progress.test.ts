import { describe, it, expect } from "vitest";
import { lapsCompleted } from "@/lib/lap-progress";

describe("lapsCompleted", () => {
  it("counts a finish as the final lap", () => {
    expect(lapsCompleted(3, true, 10)).toBe(4);
    expect(lapsCompleted(3, false, 10)).toBe(3);
  });
  it("clamps to lapCount (guards dirty data)", () => {
    expect(lapsCompleted(10, true, 10)).toBe(10); // 10 + 1 → clamp to 10
    expect(lapsCompleted(12, false, 10)).toBe(10);
  });
  it("does not clamp when lapCount is 0 / unknown", () => {
    expect(lapsCompleted(5, true, 0)).toBe(6);
  });
});

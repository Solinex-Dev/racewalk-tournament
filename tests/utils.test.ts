import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("dedupes conflicting Tailwind utilities (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("drops falsy values and supports conditional objects", () => {
    expect(cn("a", false, null, undefined, "c")).toBe("a c");
    expect(cn("base", { active: true, off: false })).toBe("base active");
  });
});

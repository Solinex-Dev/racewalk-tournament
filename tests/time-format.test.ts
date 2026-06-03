import { describe, it, expect } from "vitest";
import { formatRaceTime, parseRaceTime } from "@/lib/time-format";

describe("formatRaceTime", () => {
  it("formats HH:MM:SS with zero-padding", () => {
    expect(formatRaceTime(0)).toBe("00:00:00");
    expect(formatRaceTime(1000)).toBe("00:00:01");
    expect(formatRaceTime(61_000)).toBe("00:01:01");
    expect(formatRaceTime(3_661_000)).toBe("01:01:01");
  });
  it("clamps negative and non-finite input to zero", () => {
    expect(formatRaceTime(-5)).toBe("00:00:00");
    expect(formatRaceTime(Number.NaN)).toBe("00:00:00");
    expect(formatRaceTime(Number.POSITIVE_INFINITY)).toBe("00:00:00");
  });
  it("truncates sub-second remainders", () => {
    expect(formatRaceTime(1999)).toBe("00:00:01");
  });
});

describe("parseRaceTime", () => {
  it("parses SS / MM:SS / H:MM:SS", () => {
    expect(parseRaceTime("5")).toBe(5000);
    expect(parseRaceTime("1:30")).toBe(90_000);
    expect(parseRaceTime("1:01:01")).toBe(3_661_000);
  });
  it("trims surrounding whitespace", () => {
    expect(parseRaceTime("  90  ")).toBe(90_000);
  });
  it("returns null for invalid input", () => {
    expect(parseRaceTime("abc")).toBeNull();
    expect(parseRaceTime("1:bad")).toBeNull();
    expect(parseRaceTime("1:2:3:4")).toBeNull();
  });
  it("is the inverse of formatRaceTime", () => {
    expect(formatRaceTime(parseRaceTime("1:01:01")!)).toBe("01:01:01");
  });
});

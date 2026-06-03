import { describe, it, expect } from "vitest";
import { compareAthletesByFinish, type SortableAthlete } from "@/lib/athlete-sort";

const A = (o: Partial<SortableAthlete>): SortableAthlete => ({
  status: "OK",
  position: null,
  isFinished: false,
  currentLap: 0,
  bib: "1",
  ...o,
});

describe("compareAthletesByFinish", () => {
  it("sorts in-standing (OK) athletes before DQ / DNF", () => {
    expect(compareAthletesByFinish(A({ status: "OK" }), A({ status: "DQ" }))).toBeLessThan(0);
    expect(compareAthletesByFinish(A({ status: "DNF" }), A({ status: "OK" }))).toBeGreaterThan(0);
  });
  it("sorts finished athletes by finish position", () => {
    const first = A({ isFinished: true, position: 1 });
    const second = A({ isFinished: true, position: 2 });
    expect(compareAthletesByFinish(first, second)).toBeLessThan(0);
  });
  it("sorts still-racing athletes ahead of those who have finished", () => {
    expect(
      compareAthletesByFinish(
        A({ isFinished: true, position: 5 }),
        A({ isFinished: false, currentLap: 9 }),
      ),
    ).toBe(1);
    expect(
      compareAthletesByFinish(
        A({ isFinished: false, currentLap: 9 }),
        A({ isFinished: true, position: 5 }),
      ),
    ).toBe(-1);
  });
  it("sorts still-racing athletes by furthest lap (descending)", () => {
    expect(compareAthletesByFinish(A({ currentLap: 8 }), A({ currentLap: 5 }))).toBeLessThan(0);
  });
  it("falls back to bib number as the final tiebreak", () => {
    expect(compareAthletesByFinish(A({ bib: "10" }), A({ bib: "11" }))).toBeLessThan(0);
  });
  it("orders a mixed field: racing(by lap) → finished(by pos) → DQ/DNF", () => {
    const field: SortableAthlete[] = [
      A({ bib: "3", status: "DQ" }),
      A({ bib: "1", isFinished: true, position: 2 }),
      A({ bib: "2", isFinished: true, position: 1 }),
      A({ bib: "4", currentLap: 7 }),
    ];
    const order = [...field].sort(compareAthletesByFinish).map((x) => x.bib);
    expect(order).toEqual(["4", "2", "1", "3"]);
  });
});

// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JudgeCardMatrix, MAX_YELLOW, MAX_RED } from "@/components/judge/card-matrix";

describe("JudgeCardMatrix", () => {
  it("renders MAX_YELLOW yellow slots and fills `yellow` of them", () => {
    const { container } = render(<JudgeCardMatrix yellow={1} red={0} />);
    expect(container.querySelectorAll(".bg-amber-400")).toHaveLength(1);
  });

  it("fills `red` of maxRed slots and renders their symbols", () => {
    const { container } = render(
      <JudgeCardMatrix
        yellow={0}
        red={2}
        maxRed={4}
        redDetails={[{ symbol: ">" }, { symbol: "~" }]}
      />,
    );
    expect(container.querySelectorAll(".bg-red-500")).toHaveLength(2);
    expect(container.textContent).toContain(">");
    expect(container.textContent).toContain("~");
  });

  it("hides the yellow column when hideYellow is set", () => {
    const { container } = render(<JudgeCardMatrix yellow={2} red={0} hideYellow />);
    expect(container.querySelectorAll(".bg-amber-400")).toHaveLength(0);
  });

  it("clamps over-large counts to the maxima", () => {
    expect(MAX_YELLOW).toBe(2);
    expect(MAX_RED).toBe(4);
    const { container } = render(<JudgeCardMatrix yellow={99} red={99} />);
    expect(container.querySelectorAll(".bg-amber-400")).toHaveLength(MAX_YELLOW);
    expect(container.querySelectorAll(".bg-red-500")).toHaveLength(MAX_RED);
  });
});

// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JudgesList } from "@/components/judges/judges-list";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeJudges = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    prefix: "นาย",
    first_name: `Judge${i}`,
    middle_name: "",
    last_name: "X",
    department: "Dept",
    organization: "Org",
    country: "Thailand",
    province: "Bangkok",
    status: (i % 2 === 0 ? "active" : "inactive") as "active" | "inactive",
  }));

describe("JudgesList", () => {
  it("renders up to 10 rows on the first page and paginates the rest", () => {
    render(<JudgesList judges={makeJudges(12)} />);
    // The name cell renders "{prefix} {first} {last}" across separate text
    // nodes, so match the first name with a substring regex.
    expect(screen.getByText(/Judge0/)).toBeInTheDocument();
    expect(screen.getByText(/Judge9/)).toBeInTheDocument();
    expect(screen.queryByText(/Judge10/)).not.toBeInTheDocument();
    expect(screen.getByText(/หน้า 1 จาก 2/)).toBeInTheDocument();
  });

  it("filters rows via the search box", async () => {
    const user = userEvent.setup();
    render(<JudgesList judges={makeJudges(12)} />);
    // The filter panel is collapsed by default — open it to reveal the search box.
    await user.click(screen.getByRole("button", { name: "ค้นหาและกรองขั้นสูง" }));
    await user.type(screen.getByPlaceholderText(/ค้นหา/), "Judge5");
    expect(screen.getByText(/Judge5/)).toBeInTheDocument();
    expect(screen.queryByText(/Judge4/)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no judges", () => {
    render(<JudgesList judges={[]} />);
    expect(screen.getByText(/ไม่พบข้อมูลกรรมการ/)).toBeInTheDocument();
  });
});

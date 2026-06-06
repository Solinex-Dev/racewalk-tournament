// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AthletesList } from "@/components/athletes/athletes-list";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeAthletes = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    prefix: "นาย",
    first_name: `Athlete${i}`,
    middle_name: "",
    last_name: "X",
    affiliation: "Aff",
    country: "Thailand",
    province: "Bangkok",
    club: "Club",
  }));

describe("AthletesList", () => {
  it("renders up to 10 rows on the first page and paginates the rest", () => {
    render(<AthletesList athletes={makeAthletes(12)} />);
    // The name cell renders "{prefix}{first} {last}" across separate text nodes.
    expect(screen.getByText(/Athlete0/)).toBeInTheDocument();
    expect(screen.getByText(/Athlete9/)).toBeInTheDocument();
    expect(screen.queryByText(/Athlete10/)).not.toBeInTheDocument();
    expect(screen.getByText(/หน้า 1 จาก 2/)).toBeInTheDocument();
  });

  it("filters rows via the search box", async () => {
    const user = userEvent.setup();
    render(<AthletesList athletes={makeAthletes(12)} />);
    // The filter panel is collapsed by default — open it to reveal the search box.
    await user.click(screen.getByRole("button", { name: "ค้นหาและกรองขั้นสูง" }));
    await user.type(screen.getByPlaceholderText(/ค้นหา/), "Athlete5");
    expect(screen.getByText(/Athlete5/)).toBeInTheDocument();
    expect(screen.queryByText(/Athlete4/)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no athletes", () => {
    render(<AthletesList athletes={[]} />);
    expect(screen.getByText(/ไม่พบข้อมูลนักกีฬา/)).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AffiliationsList } from "@/components/affiliations/affiliations-list";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeAffiliations = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    name: `Affil ${i}`,
    head_of_affiliation: "Head",
    join_at: "2026-01-01",
    country: "Thailand",
    province: "Bangkok",
  }));

describe("AffiliationsList", () => {
  it("renders up to 10 rows on the first page and paginates the rest", () => {
    render(<AffiliationsList affiliations={makeAffiliations(12)} />);
    expect(screen.getByText("Affil 0")).toBeInTheDocument();
    expect(screen.getByText("Affil 9")).toBeInTheDocument();
    expect(screen.queryByText("Affil 10")).not.toBeInTheDocument();
    expect(screen.getByText(/หน้า 1 จาก 2/)).toBeInTheDocument();
  });

  it("filters rows via the search box", async () => {
    const user = userEvent.setup();
    render(<AffiliationsList affiliations={makeAffiliations(12)} />);
    // The filter panel is collapsed by default — open it to reveal the search box.
    await user.click(screen.getByRole("button", { name: "ค้นหาและกรองขั้นสูง" }));
    await user.type(screen.getByPlaceholderText(/ค้นหา/), "Affil 5");
    expect(screen.getByText("Affil 5")).toBeInTheDocument();
    expect(screen.queryByText("Affil 4")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no affiliations", () => {
    render(<AffiliationsList affiliations={[]} />);
    expect(screen.getByText(/ไม่พบข้อมูลสังกัด/)).toBeInTheDocument();
  });
});

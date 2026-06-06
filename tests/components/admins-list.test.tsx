// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminsList } from "@/components/admins/admins-list";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeAdmins = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    name: `Admin ${i}`,
    role: "Owner",
    email: `a${i}@example.com`,
    status: (i % 2 === 0 ? "active" : "inactive") as "active" | "inactive",
  }));

describe("AdminsList", () => {
  it("renders up to 10 rows on the first page and paginates the rest", () => {
    render(<AdminsList admins={makeAdmins(12)} />);
    expect(screen.getByText("Admin 0")).toBeInTheDocument();
    expect(screen.getByText("Admin 9")).toBeInTheDocument();
    expect(screen.queryByText("Admin 10")).not.toBeInTheDocument();
    expect(screen.getByText(/หน้า 1 จาก 2/)).toBeInTheDocument();
  });

  it("filters rows via the search box", async () => {
    const user = userEvent.setup();
    render(<AdminsList admins={makeAdmins(12)} />);
    // The filter panel is collapsed by default — open it to reveal the search box.
    await user.click(screen.getByRole("button", { name: "ค้นหาและกรองขั้นสูง" }));
    await user.type(screen.getByPlaceholderText(/ค้นหา/), "Admin 5");
    expect(screen.getByText("Admin 5")).toBeInTheDocument();
    expect(screen.queryByText("Admin 4")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no admins", () => {
    render(<AdminsList admins={[]} />);
    expect(screen.getByText(/ไม่พบข้อมูล Admin/)).toBeInTheDocument();
  });
});

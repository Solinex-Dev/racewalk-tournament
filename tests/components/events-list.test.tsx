// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventsList } from "@/components/events/events-list";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

type Status = "draft" | "scheduled" | "ongoing" | "finished";
const makeEvents = (n: number, status: Status = "draft") =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    name: `Event ${i}`,
    date: "2026-07-01",
    location: "Bangkok",
    distance_km: "20",
    status,
  }));

describe("EventsList", () => {
  it("renders the first page of events with their status label", () => {
    render(<EventsList events={makeEvents(12)} />);
    expect(screen.getByText("Event 0")).toBeInTheDocument();
    expect(screen.getByText("Event 9")).toBeInTheDocument();
    expect(screen.queryByText("Event 10")).not.toBeInTheDocument();
    expect(screen.getByText(/หน้า 1 จาก 2/)).toBeInTheDocument();
    // STATUS_LABEL.draft
    expect(screen.getAllByText("ร่าง").length).toBeGreaterThan(0);
  });

  it("filters rows via the search box", async () => {
    const user = userEvent.setup();
    render(<EventsList events={makeEvents(12)} />);
    // The filter panel is collapsed by default — open it to reveal the search box.
    await user.click(screen.getByRole("button", { name: "ค้นหาและกรองขั้นสูง" }));
    await user.type(screen.getByPlaceholderText(/ชื่อ Event/), "Event 5");
    expect(screen.getByText("Event 5")).toBeInTheDocument();
    expect(screen.queryByText("Event 4")).not.toBeInTheDocument();
  });

  it("shows a LIVE badge and permission-gated action buttons for an ongoing event", () => {
    render(
      <EventsList
        events={makeEvents(1, "ongoing")}
        canViewEvents
        canViewReports
        canModerate
      />,
    );
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("กำลังดำเนินการ")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "รายละเอียด/แก้ไข" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export Report" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Moderator" })).toBeInTheDocument();
  });

  it("hides action buttons when the admin lacks permissions", () => {
    render(<EventsList events={makeEvents(1, "scheduled")} />);
    expect(
      screen.queryByRole("button", { name: "รายละเอียด/แก้ไข" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Moderator" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no events", () => {
    render(<EventsList events={[]} />);
    expect(screen.getByText(/ไม่พบข้อมูล Event/)).toBeInTheDocument();
  });
});

import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { EventsList } from "@/components/events/events-list";

type AdminEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
  isCurrent?: boolean;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_EVENTS: AdminEvent[] = [
  {
    id: "evt-001",
    name: "Racewalk Championship 2025",
    date: "2025-03-15",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "ongoing",
    isCurrent: true,
  },
  {
    id: "evt-002",
    name: "Bangkok City Racewalk",
    date: "2025-01-20",
    location: "Bangkok City Route",
    distance_km: "10",
    status: "finished",
  },
  {
    id: "evt-003",
    name: "Thailand National Race Walk Championship",
    date: "2025-05-20",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "scheduled",
  },
  {
    id: "evt-004",
    name: "Chiang Mai Race Walk Open",
    date: "2025-06-10",
    location: "Chiang Mai Sports Complex",
    distance_km: "10",
    status: "scheduled",
  },
  {
    id: "evt-005",
    name: "Phuket Beach Race Walk",
    date: "2025-07-15",
    location: "Patong Beach",
    distance_km: "5",
    status: "scheduled",
  },
  {
    id: "evt-006",
    name: "Bangkok Marathon Race Walk",
    date: "2024-12-10",
    location: "Bangkok City Center",
    distance_km: "20",
    status: "finished",
  },
  {
    id: "evt-007",
    name: "New Year Race Walk 2025",
    date: "2025-01-01",
    location: "สนามหลวง",
    distance_km: "10",
    status: "finished",
  },
  {
    id: "evt-008",
    name: "Southeast Asian Race Walk Meet",
    date: "2025-08-20",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "scheduled",
  },
  {
    id: "evt-009",
    name: "Youth Race Walk Challenge",
    date: "2025-04-05",
    location: "Bangkok University Stadium",
    distance_km: "5",
    status: "scheduled",
  },
  {
    id: "evt-010",
    name: "Loy Krathong Race Walk Festival",
    date: "2024-11-15",
    location: "Lumphini Park",
    distance_km: "10",
    status: "finished",
  },
  {
    id: "evt-011",
    name: "Asian Junior Race Walk Championship",
    date: "2025-09-10",
    location: "Rajamangala Stadium",
    distance_km: "10",
    status: "scheduled",
  },
  {
    id: "evt-012",
    name: "Charity Race Walk for Education",
    date: "2025-10-05",
    location: "Bangkok City Route",
    distance_km: "5",
    status: "scheduled",
  },
  {
    id: "evt-013",
    name: "Winter Race Walk Series - Round 1",
    date: "2024-12-20",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "finished",
  },
  {
    id: "evt-014",
    name: "Spring Race Walk Open",
    date: "2025-03-25",
    location: "Chiang Mai",
    distance_km: "10",
    status: "draft",
  },
  {
    id: "evt-015",
    name: "Summer Race Walk Challenge",
    date: "2025-07-30",
    location: "Pattaya Beach",
    distance_km: "10",
    status: "scheduled",
  },
  {
    id: "evt-016",
    name: "Masters Race Walk Championship",
    date: "2025-11-15",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "10",
    status: "scheduled",
  },
  {
    id: "evt-017",
    name: "University Race Walk Cup",
    date: "2025-02-28",
    location: "Thammasat University",
    distance_km: "5",
    status: "finished",
  },
  {
    id: "evt-018",
    name: "Night Race Walk Bangkok",
    date: "2025-12-31",
    location: "Bangkok City Center",
    distance_km: "10",
    status: "scheduled",
  },
  {
    id: "evt-019",
    name: "International Race Walk Invitational",
    date: "2025-10-20",
    location: "สนามกีฬาแห่งชาติ",
    distance_km: "20",
    status: "scheduled",
  },
  {
    id: "evt-020",
    name: "Songkran Race Walk Festival",
    date: "2025-04-13",
    location: "Khao San Road",
    distance_km: "5",
    status: "scheduled",
  },
  {
    id: "evt-021",
    name: "Corporate Race Walk Challenge",
    date: "2025-05-15",
    location: "Lumphini Park",
    distance_km: "5",
    status: "scheduled",
  },
  {
    id: "evt-022",
    name: "Race Walk Training Camp Event",
    date: "2025-06-01",
    location: "Hua Hin Sports Center",
    distance_km: "10",
    status: "draft",
  },
];

export const metadata: Metadata = {
  title: "จัดการกิจกรรม – การแข่งขันเดินทน",
  description:
    "หน้ารายการกิจกรรมทั้งหมดในระบบจัดการการแข่งขันเดินทน",
};

export default function EventsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการ Event
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการ Event ทั้งหมดที่ถูกสร้างในระบบ
              พร้อมสถานะและข้อมูลเบื้องต้นของการแข่งขัน
            </p>
          </div>

          <Link href="/admin/events/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + สร้าง Event ใหม่
            </Button>
          </Link>
        </div>

        <EventsList events={MOCK_EVENTS} />
      </div>
    </main>
  );
}



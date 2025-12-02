import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { AdminsList } from "@/components/admins/admins-list";

type Admin = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "active" | "inactive";
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_ADMINS: Admin[] = [
  {
    id: "adm-001",
    name: "ผู้ดูแลระบบ",
    role: "เจ้าของระบบ",
    email: "admin@example.com",
    status: "active",
  },
  {
    id: "adm-002",
    name: "ผู้จัดการกิจกรรม",
    role: "ผู้ดูแลกิจกรรม",
    email: "event@example.com",
    status: "active",
  },
  {
    id: "adm-003",
    name: "เจ้าหน้าที่คะแนน",
    role: "ผู้ดูแลคะแนน",
    email: "score@example.com",
    status: "inactive",
  },
];

export const metadata: Metadata = {
  title: "จัดการผู้ดูแลระบบ – การแข่งขันเดินทน",
  description:
    "หน้ารายการผู้ดูแลระบบทั้งหมดพร้อมลิงก์ดูรายละเอียดและสร้างผู้ดูแลระบบใหม่",
};

export default function AdminsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการผู้ดูแลระบบ
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการผู้ดูแลระบบทั้งหมดพร้อมลิงก์เข้าไปดู
              / แก้ไข และสร้างผู้ดูแลระบบใหม่
            </p>
          </div>

          <Link href="/admin/admins/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่ม Admin ใหม่
            </Button>
          </Link>
        </div>

        <AdminsList admins={MOCK_ADMINS} />
      </div>
    </main>
  );
}


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    name: "System Admin",
    role: "Owner",
    email: "admin@example.com",
    status: "active",
  },
  {
    id: "adm-002",
    name: "Event Manager",
    role: "Event admin",
    email: "event@example.com",
    status: "active",
  },
  {
    id: "adm-003",
    name: "Scoring Staff",
    role: "Score admin",
    email: "score@example.com",
    status: "inactive",
  },
];

export default function AdminsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการผู้ดูแลระบบ (Admins)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการผู้ดูแลระบบทั้งหมดของ Racewalk Tournament พร้อมลิงก์เข้าไปดู
              / แก้ไข และสร้าง admin ใหม่
            </p>
          </div>

          <Link href="/admin/admins/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่ม Admin ใหม่
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ชื่อ</th>
                    <th className="px-4 py-3 text-left">อีเมล</th>
                    <th className="px-4 py-3 text-left">สิทธิ์ / บทบาท</th>
                    <th className="px-4 py-3 text-left">สถานะ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {MOCK_ADMINS.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {admin.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {admin.email}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {admin.role}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            admin.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {admin.status === "active" ? "ใช้งานอยู่" : "ปิดการใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/admins/${admin.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-slate-200 text-xs"
                          >
                            ดู / แก้ไข
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
              * ข้อมูลในตารางนี้เป็นตัวอย่างเบื้องต้น – จะเชื่อมต่อฐานข้อมูล MySQL
              ผ่าน Prisma ภายหลัง
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


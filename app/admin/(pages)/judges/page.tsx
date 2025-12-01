import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Judge = {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  organization: string;
  status: "active" | "inactive";
  note?: string;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_JUDGES: Judge[] = [
  {
    id: "jud-001",
    first_name: "Somchai",
    last_name: "Rakdee",
    department: "Technical Committee",
    organization: "สมาคมกรีฑาแห่งประเทศไทย",
    status: "active",
    note: "หัวหน้าทีมกรรมการหลัก",
  },
  {
    id: "jud-002",
    first_name: "Jane",
    last_name: "Smith",
    department: "Scoring",
    organization: "Example Athletic Federation",
    status: "inactive",
    note: "",
  },
];

export const metadata: Metadata = {
  title: "จัดการกรรมการ – การแข่งขันเดินทน",
  description:
    "หน้ารายชื่อกรรมการทั้งหมดที่ใช้ในการตัดสินการแข่งขันเดินทน",
};

export default function JudgesPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการกรรมการ
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายชื่อกรรมการทั้งหมดที่ถูกลงทะเบียนในระบบสำหรับใช้ตัดสินการแข่งขันเดินทน
            </p>
          </div>

          <Link href="/admin/judges/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่มกรรมการใหม่
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-3 text-left">แผนก / หน่วยงาน</th>
                    <th className="px-4 py-3 text-left">องค์กร / สังกัด</th>
                    <th className="px-4 py-3 text-left">สถานะ</th>
                    <th className="px-4 py-3 text-left">หมายเหตุ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {MOCK_JUDGES.map((judge) => (
                    <tr key={judge.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {judge.first_name} {judge.last_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.department || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.organization || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            judge.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {judge.status === "active"
                            ? "ใช้งานอยู่"
                            : "ปิดการใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/judges/${judge.id}`}>
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



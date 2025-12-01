import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  country: string;
  note?: string;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_ATHLETES: Athlete[] = [
  {
    id: "ath-001",
    first_name: "Somchai",
    last_name: "Rakdee",
    affiliation: "ชมรมเดินทนกรุงเทพฯ",
    country: "Thailand",
    note: "นักกีฬาทีมชาติ",
  },
  {
    id: "ath-002",
    first_name: "Jane",
    last_name: "Doe",
    affiliation: "Example Athletic Club",
    country: "USA",
    note: "",
  },
];

export default function AthletesPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการนักกีฬา (Athletes)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายชื่อนักกีฬาทั้งหมดที่ถูกลงทะเบียนในระบบการแข่งขันเดินทน
            </p>
          </div>

          <Link href="/admin/athletes/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่มนักกีฬาใหม่
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
                    <th className="px-4 py-3 text-left">สังกัด / สโมสร</th>
                    <th className="px-4 py-3 text-left">ประเทศ</th>
                    <th className="px-4 py-3 text-left">หมายเหตุ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {MOCK_ATHLETES.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {athlete.first_name} {athlete.last_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.affiliation || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.country || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/athletes/${athlete.id}`}>
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



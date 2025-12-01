import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Affiliation = {
  id: string;
  name: string;
  head_of_affiliation: string;
  join_at: string;
  note?: string;
};

// TODO: เชื่อมต่อกับฐานข้อมูล / API จริงภายหลัง
const MOCK_AFFILIATIONS: Affiliation[] = [
  {
    id: "aff-001",
    name: "ชมรมเดินทนกรุงเทพฯ",
    head_of_affiliation: "นายสมชาย รักดี",
    join_at: "2024-01-15",
    note: "กลุ่มตัวอย่างสำหรับทดสอบระบบ",
  },
  {
    id: "aff-002",
    name: "Example Athletic Club",
    head_of_affiliation: "Jane Manager",
    join_at: "2024-03-01",
    note: "",
  },
];

export default function AffiliationsPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการสังกัด / สโมสร (Affiliations)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการสังกัด / สโมสรของนักกีฬา เพื่อใช้เชื่อมโยงกับข้อมูล Athlete
            </p>
          </div>

          <Link href="/admin/affiliations/new">
            <Button className="rounded-xl px-4 py-2 text-sm font-medium">
              + เพิ่มสังกัด / สโมสรใหม่
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden rounded-2xl border-slate-200">
          <CardContent className="p-0">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ชื่อสังกัด / สโมสร</th>
                    <th className="px-4 py-3 text-left">ผู้ดูแล / หัวหน้าสังกัด</th>
                    <th className="px-4 py-3 text-left">วันที่เข้าร่วม</th>
                    <th className="px-4 py-3 text-left">หมายเหตุ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {MOCK_AFFILIATIONS.map((affiliation) => (
                    <tr key={affiliation.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {affiliation.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.head_of_affiliation || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.join_at || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/affiliations/${affiliation.id}`}>
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



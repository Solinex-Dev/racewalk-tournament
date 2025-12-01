import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JudgeForm } from "@/components/judges/judge-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลกรรมการ – Racewalk Tournament",
  description:
    "หน้าแก้ไขข้อมูลกรรมการที่ลงทะเบียนในระบบ Racewalk Tournament สำหรับอัปเดตแผนก องค์กร และสถานะการใช้งาน.",
};

const MOCK_JUDGE_BY_ID = {
  "jud-001": {
    first_name: "Somchai",
    last_name: "Rakdee",
    department: "Technical Committee",
    organization: "สมาคมกรีฑาแห่งประเทศไทย",
    status: "active" as const,
    note: "หัวหน้าทีมกรรมการหลัก",
  },
  "jud-002": {
    first_name: "Jane",
    last_name: "Smith",
    department: "Scoring",
    organization: "Example Athletic Federation",
    status: "inactive" as const,
    note: "",
  },
};

type JudgeDetailPageProps = {
  params: Promise<{
    judgeId: string;
  }>;
};

export default async function JudgeDetailPage(props: JudgeDetailPageProps) {
  const { judgeId } = await props.params;

  const judge = MOCK_JUDGE_BY_ID[judgeId as keyof typeof MOCK_JUDGE_BY_ID];

  if (!judge) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขข้อมูลกรรมการ
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูลกรรมการที่เลือก
            </p>
          </div>

          <Link href="/admin/judges">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <JudgeForm mode="edit" defaultValues={judge} />
      </div>
    </main>
  );
}



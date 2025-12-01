import Link from "next/link";
import type { Metadata } from "next";
import { JudgeForm } from "@/components/judges/judge-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "เพิ่มกรรมการใหม่ – Racewalk Tournament",
  description:
    "ฟอร์มเพิ่มข้อมูลกรรมการใหม่สำหรับใช้งานในระบบตัดสินและบันทึกผลการแข่งขันเดินทน.",
};

export default function NewJudgePage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              เพิ่มกรรมการใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มเพิ่มข้อมูลกรรมการ โดยระบุชื่อ แผนก องค์กร และสถานะการใช้งาน
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

        <JudgeForm mode="create" />
      </div>
    </main>
  );
}



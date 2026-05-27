import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JudgeForm } from "@/components/judges/judge-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แก้ไขข้อมูลกรรมการ – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลกรรมการที่ลงทะเบียนในระบบ",
};

type Props = { params: Promise<{ judgeId: string }> };

export default async function JudgeDetailPage(props: Props) {
  const { judgeId } = await props.params;

  const judge = await prisma.judge.findUnique({
    where: { id: judgeId, deletedAt: null },
  });
  if (!judge) notFound();

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขข้อมูลกรรมการ
            </h1>
            <p className="mt-1 text-sm text-slate-600">ดูและอัปเดตข้อมูลกรรมการที่เลือก</p>
          </div>

          <Link href="/admin/judges">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <JudgeForm
          mode="edit"
          judgeId={judgeId}
          defaultValues={{ name: judge.name }}
        />
      </div>
    </main>
  );
}

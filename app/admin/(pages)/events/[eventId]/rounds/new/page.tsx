import Link from "next/link";
import type { Metadata } from "next";
import { RoundForm } from "@/components/rounds/round-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "สร้างรอบแข่งใหม่ – การแข่งขันเดินทน",
  description: "ฟอร์มสร้างรอบแข่งใหม่ใน Event การแข่งขันเดินทน",
};

type Props = { params: Promise<{ eventId: string }> };

export default async function NewRoundPage(props: Props) {
  const { eventId } = await props.params;

  const [athletes, judges] = await Promise.all([
    prisma.athlete.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.judge.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              สร้างรอบแข่งใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มสร้างรอบแข่งใหม่ใน Event นี้
              เพื่อเพิ่มนักกีฬาและกรรมการสำหรับรอบนี้
            </p>
          </div>

          <Link href={`/admin/events/${eventId}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้า Event
            </Button>
          </Link>
        </div>

        <RoundForm
          mode="create"
          eventId={eventId}
          athleteOptions={athletes}
          judgeOptions={judges}
        />
      </div>
    </main>
  );
}

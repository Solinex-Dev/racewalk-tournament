import Link from "next/link";
import type { Metadata } from "next";
import { AdminForm } from "@/components/admins/admin-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "สร้าง Admin ใหม่ – Racewalk Tournament",
  description:
    "ฟอร์มสร้างผู้ดูแลระบบใหม่สำหรับจัดการ Event, Judges และ Athletes ใน Racewalk Tournament.",
};

export default function NewAdminPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              สร้าง Admin ใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มสร้างผู้ดูแลระบบสำหรับจัดการ Event, Judges และ Athletes
            </p>
          </div>

          <Link href="/admin/admins">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AdminForm mode="create" />
      </div>
    </main>
  );
}



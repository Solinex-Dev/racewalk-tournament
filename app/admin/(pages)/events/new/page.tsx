import Link from "next/link";
import type { Metadata } from "next";
import { EventForm } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";

export const metadata: Metadata = {
  title: "สร้างกิจกรรมใหม่ – การแข่งขันเดินทน",
  description:
    "ฟอร์มสร้าง Event การแข่งขันเดินทนใหม่ ระบุชื่อ วันที่ สถานที่ ระยะทาง และโค้ดสำหรับกรรมการ.",
};

export default function NewEventPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "Events", href: "/admin/events" },
            { label: "สร้าง Event ใหม่" },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              สร้าง Event ใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มสร้าง Event การแข่งขันใหม่
              เพื่อใช้สำหรับจัดการฝั่งกรรมการและหน้าแสดงผลสาธารณะ
            </p>
          </div>

          <Link href="/admin/events">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <EventForm mode="create" />
      </div>
    </main>
  );
}



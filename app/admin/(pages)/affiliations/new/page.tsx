import Link from "next/link";
import type { Metadata } from "next";
import { AffiliationForm } from "@/components/affiliations/affiliation-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "เพิ่มสังกัด / สโมสรใหม่ – การแข่งขันเดินทน",
  description:
    "ฟอร์มเพิ่มข้อมูลสังกัด / สโมสรของนักกีฬา เพื่อให้เลือกใช้ในหน้าจัดการ Athletes ของ Racewalk Tournament.",
};

export default function NewAffiliationPage() {
  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              เพิ่มสังกัด / สโมสรใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มเพิ่มข้อมูลสังกัด / สโมสรของนักกีฬา เพื่อให้เลือกใช้ในหน้าจัดการ Athletes
            </p>
          </div>

          <Link href="/admin/affiliations">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AffiliationForm mode="create" />
      </div>
    </main>
  );
}

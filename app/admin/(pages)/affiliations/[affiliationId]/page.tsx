import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AffiliationForm } from "@/components/affiliations/affiliation-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "แก้ไขสังกัด / สโมสร – การแข่งขันเดินทน",
  description:
    "หน้าแก้ไขข้อมูลสังกัด / สโมสร เช่น ชื่อสังกัด ผู้ดูแล วันที่เข้าร่วม และหมายเหตุ สำหรับใช้ร่วมกับข้อมูลนักกีฬา.",
};

const MOCK_AFFILIATION_BY_ID = {
  "aff-001": {
    name: "ชมรมเดินทนกรุงเทพฯ",
    head_of_affiliation: "นายสมชาย รักดี",
    join_at: "2024-01-15",
    note: "กลุ่มตัวอย่างสำหรับทดสอบระบบ",
  },
  "aff-002": {
    name: "Example Athletic Club",
    head_of_affiliation: "Jane Manager",
    join_at: "2024-03-01",
    note: "",
  },
};

type AffiliationDetailPageProps = {
  params: Promise<{
    affiliationId: string;
  }>;
};

export default async function AffiliationDetailPage(
  props: AffiliationDetailPageProps,
) {
  const { affiliationId } = await props.params;

  const affiliation =
    MOCK_AFFILIATION_BY_ID[
      affiliationId as keyof typeof MOCK_AFFILIATION_BY_ID
    ];

  if (!affiliation) {
    // TODO: ในภายหลังให้เปลี่ยนมา fetch จากฐานข้อมูลจริง และ handle not found ให้เหมาะสม
    notFound();
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขสังกัด / สโมสร
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ดูและอัปเดตข้อมูลสังกัด / สโมสรที่เลือก
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

        <AffiliationForm mode="edit" defaultValues={affiliation} />
      </div>
    </main>
  );
}



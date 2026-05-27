import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AffiliationForm } from "@/components/affiliations/affiliation-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แก้ไขสังกัด / สโมสร – การแข่งขันเดินทน",
  description: "หน้าแก้ไขข้อมูลสังกัด / สโมสร",
};

type Props = { params: Promise<{ affiliationId: string }> };

export default async function AffiliationDetailPage(props: Props) {
  const { affiliationId } = await props.params;

  const aff = await prisma.affiliation.findUnique({
    where: { id: affiliationId, deletedAt: null },
  });
  if (!aff) notFound();

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              แก้ไขสังกัด / สโมสร
            </h1>
            <p className="mt-1 text-sm text-slate-600">ดูและอัปเดตข้อมูลสังกัด / สโมสรที่เลือก</p>
          </div>

          <Link href="/admin/affiliations">
            <Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-xs">
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AffiliationForm
          mode="edit"
          affiliationId={affiliationId}
          defaultValues={{
            name: aff.name,
            country: aff.country,
            province: aff.province ?? "",
            headOfAffiliation: aff.headOfAffiliation ?? "",
            joinedAt: aff.joinedAt ? aff.joinedAt.toISOString().slice(0, 10) : "",
            note: aff.note ?? "",
          }}
        />
      </div>
    </main>
  );
}

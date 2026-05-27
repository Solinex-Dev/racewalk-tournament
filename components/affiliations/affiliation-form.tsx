"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAffiliation, updateAffiliation } from "@/app/actions/affiliations";

export type AffiliationFormValues = {
  name: string;
  country: string;
  province: string;
  headOfAffiliation: string;
  joinedAt: string;
  note: string;
};

type AffiliationFormProps = {
  mode: "create" | "edit";
  affiliationId?: string;
  defaultValues?: Partial<AffiliationFormValues>;
};

const EMPTY: AffiliationFormValues = {
  name: "",
  country: "THA",
  province: "",
  headOfAffiliation: "",
  joinedAt: "",
  note: "",
};

export function AffiliationForm({ mode, affiliationId, defaultValues }: AffiliationFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AffiliationFormValues>({ ...EMPTY, ...defaultValues });
  const [isPending, startTransition] = React.useTransition();

  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name: form.name.trim(),
          country: form.country.trim() || "THA",
          province: form.province.trim() || null,
          headOfAffiliation: form.headOfAffiliation.trim() || null,
          joinedAt: form.joinedAt || null,
          note: form.note.trim() || null,
        };
        if (isEdit && affiliationId) {
          await updateAffiliation(affiliationId, payload);
          toast.success("บันทึกการแก้ไขเรียบร้อย");
        } else {
          await createAffiliation(payload);
          toast.success("เพิ่มสังกัดเรียบร้อย");
        }
        router.push("/admin/affiliations");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขสังกัด / สโมสร" : "เพิ่มสังกัด / สโมสรใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          จัดการข้อมูลสังกัด / สโมสร เช่น ชมรม มหาวิทยาลัย หรือทีมตัวแทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ชื่อสังกัด / สโมสร <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น ชมรมเดินทนกรุงเทพฯ"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                ประเทศ (ISO 3-letter)
              </label>
              <Input
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value.toUpperCase() }))}
                placeholder="เช่น THA"
                maxLength={3}
                className="rounded-xl text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">จังหวัด</label>
              <Input
                value={form.province}
                onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                placeholder="เช่น กรุงเทพมหานคร"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ผู้ดูแล / หัวหน้าสังกัด (Head of affiliation)
            </label>
            <Input
              value={form.headOfAffiliation}
              onChange={(e) => setForm((p) => ({ ...p, headOfAffiliation: e.target.value }))}
              placeholder="เช่น นายสมชาย รักดี"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              วันที่เข้าร่วม / เริ่มใช้งาน (Joined at)
            </label>
            <Input
              type="date"
              value={form.joinedAt}
              onChange={(e) => setForm((p) => ({ ...p, joinedAt: e.target.value }))}
              className="rounded-xl text-sm"
            />
            <p className="text-[11px] text-slate-500">
              วันที่สังกัดนี้เข้าร่วมระบบหรือเริ่มใช้งาน (ตัวเลือก ใช้สำหรับอ้างอิงประวัติ)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">หมายเหตุ (Note)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="รายละเอียดเพิ่มเติม เช่น ช่องทางติดต่อ, เงื่อนไขพิเศษ"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มสังกัด"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

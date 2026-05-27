"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createJudge, updateJudge } from "@/app/actions/judges";

export type JudgeFormValues = {
  name: string;
  country: string;
  province: string;
  department: string;
  organization: string;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

type JudgeFormProps = {
  mode: "create" | "edit";
  judgeId?: string;
  defaultValues?: Partial<JudgeFormValues>;
};

const EMPTY: JudgeFormValues = {
  name: "",
  country: "THA",
  province: "",
  department: "",
  organization: "",
  status: "ACTIVE",
  note: "",
};

export function JudgeForm({ mode, judgeId, defaultValues }: JudgeFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<JudgeFormValues>({ ...EMPTY, ...defaultValues });
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
          department: form.department.trim() || null,
          organization: form.organization.trim() || null,
          status: form.status,
          note: form.note.trim() || null,
        };
        if (isEdit && judgeId) {
          await updateJudge(judgeId, payload);
          toast.success("บันทึกการแก้ไขเรียบร้อย");
        } else {
          await createJudge(payload);
          toast.success("เพิ่มกรรมการเรียบร้อย");
        }
        router.push("/admin/judges");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขข้อมูลกรรมการ" : "เพิ่มกรรมการใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          ระบุข้อมูลของกรรมการ เพื่อใช้กำหนดเข้ารอบแข่งและออกรหัสลับสำหรับ login ในวันแข่ง
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ชื่อ-นามสกุล กรรมการ <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น สมชาย ใจดี"
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
              <label className="block text-xs font-medium text-slate-800">จังหวัด (Province)</label>
              <Input
                value={form.province}
                onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                placeholder="เช่น กรุงเทพมหานคร"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                แผนก / หน่วยงาน (Department)
              </label>
              <Input
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="เช่น Technical Committee"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                องค์กร / สังกัด (Organization)
              </label>
              <Input
                value={form.organization}
                onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                placeholder="เช่น สมาคมกรีฑาแห่งประเทศไทย"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-slate-800">
              สถานะการใช้งาน
            </span>
            <div className="flex gap-3 text-xs">
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={form.status === "ACTIVE"}
                  onChange={() => setForm((p) => ({ ...p, status: "ACTIVE" }))}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ใช้งานอยู่</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={form.status === "INACTIVE"}
                  onChange={() => setForm((p) => ({ ...p, status: "INACTIVE" }))}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ปิดการใช้งาน</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              กรรมการที่ปิดการใช้งานจะไม่ปรากฏใน dropdown ตอนสร้างรอบแข่ง (แต่ข้อมูลยังคงอยู่)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">หมายเหตุ (Note)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="ข้อมูลเพิ่มเติม เช่น ความเชี่ยวชาญ, ประสบการณ์, ข้อจำกัดเฉพาะ"
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
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มกรรมการ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

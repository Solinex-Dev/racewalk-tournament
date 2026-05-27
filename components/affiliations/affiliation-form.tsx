"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAffiliation, updateAffiliation } from "@/app/actions/affiliations";

export type AffiliationFormValues = {
  name: string;
};

type AffiliationFormProps = {
  mode: "create" | "edit";
  affiliationId?: string;
  defaultValues?: Partial<AffiliationFormValues>;
};

export function AffiliationForm({ mode, affiliationId, defaultValues }: AffiliationFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AffiliationFormValues>({ name: "", ...defaultValues });
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = { name: form.name.trim() };
        if (isEdit && affiliationId) {
          await updateAffiliation(affiliationId, payload);
        } else {
          await createAffiliation(payload);
        }
        router.push("/admin/affiliations");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
          จัดการข้อมูลสังกัด / สโมสรของนักกีฬา เช่น ชมรม มหาวิทยาลัย หรือทีมตัวแทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ชื่อสังกัด / สโมสร
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น ชมรมเดินทนกรุงเทพฯ"
              className="rounded-xl text-sm"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มสังกัด / สโมสร"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

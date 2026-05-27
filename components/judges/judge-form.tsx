"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createJudge, updateJudge } from "@/app/actions/judges";

export type JudgeFormValues = {
  name: string;
};

type JudgeFormProps = {
  mode: "create" | "edit";
  judgeId?: string;
  defaultValues?: Partial<JudgeFormValues>;
};

export function JudgeForm({ mode, judgeId, defaultValues }: JudgeFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<JudgeFormValues>({ name: "", ...defaultValues });
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = { name: form.name.trim() };
        if (isEdit && judgeId) {
          await updateJudge(judgeId, payload);
        } else {
          await createJudge(payload);
        }
        router.push("/admin/judges");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
          ระบุชื่อกรรมการ เพื่อใช้กำหนดเข้ารอบแข่งและออกรหัสลับสำหรับ login ในวันแข่ง
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ชื่อ-นามสกุล กรรมการ
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น Coach Somchai"
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
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มกรรมการ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

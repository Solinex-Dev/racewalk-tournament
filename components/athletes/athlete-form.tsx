"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAthlete, updateAthlete } from "@/app/actions/athletes";

export type AffiliationOption = { id: string; name: string };

export type AthleteFormValues = {
  name: string;
  country: string;
  affiliationId: string;
};

type AthleteFormProps = {
  mode: "create" | "edit";
  athleteId?: string;
  affiliations: AffiliationOption[];
  defaultValues?: Partial<AthleteFormValues>;
};

const EMPTY: AthleteFormValues = { name: "", country: "TH", affiliationId: "" };

export function AthleteForm({ mode, athleteId, affiliations, defaultValues }: AthleteFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AthleteFormValues>({ ...EMPTY, ...defaultValues });
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          name: form.name.trim(),
          country: form.country.trim() || "TH",
          affiliationId: form.affiliationId || null,
        };
        if (isEdit && athleteId) {
          await updateAthlete(athleteId, payload);
        } else {
          await createAthlete(payload);
        }
        router.push("/admin/athletes");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขข้อมูลนักกีฬา" : "เพิ่มนักกีฬาใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          ระบุข้อมูลพื้นฐานของนักกีฬาที่จะใช้ในระบบจัดการแข่งขันเดินทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ชื่อ-นามสกุล นักกีฬา
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น Somchai Rakdee"
              className="rounded-xl text-sm"
            />
            <p className="text-[11px] text-slate-500">
              ระบบจะเก็บเป็นชื่อเต็ม (ใช้ช่องว่างคั่นชื่อ-นามสกุล)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                สังกัด / สโมสร
              </label>
              <select
                value={form.affiliationId}
                onChange={(e) => setForm((p) => ({ ...p, affiliationId: e.target.value }))}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">— ไม่ระบุ —</option>
                {affiliations.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                ประเทศ (ISO code)
              </label>
              <Input
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value.toUpperCase() }))}
                placeholder="เช่น THA, ESP, GBR"
                maxLength={3}
                className="rounded-xl text-sm uppercase"
              />
              <p className="text-[11px] text-slate-500">
                ใช้ ISO 3-letter country code (เช่น THA, USA, JPN)
              </p>
            </div>
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
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มนักกีฬา"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

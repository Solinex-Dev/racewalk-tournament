"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAthlete, updateAthlete } from "@/app/actions/athletes";

export type AffiliationOption = { id: string; name: string };

export type AthleteFormValues = {
  name: string;
  country: string;
  affiliationId: string;
  province: string;
  club: string;
  note: string;
};

type AthleteFormProps = {
  mode: "create" | "edit";
  athleteId?: string;
  affiliations: AffiliationOption[];
  defaultValues?: Partial<AthleteFormValues>;
};

const EMPTY: AthleteFormValues = {
  name: "",
  country: "THA",
  affiliationId: "",
  province: "",
  club: "",
  note: "",
};

export function AthleteForm({ mode, athleteId, affiliations, defaultValues }: AthleteFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AthleteFormValues>({ ...EMPTY, ...defaultValues });
  const [isPending, startTransition] = React.useTransition();

  const isEdit = mode === "edit";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name: form.name.trim(),
          country: form.country.trim() || "THA",
          affiliationId: form.affiliationId || null,
          province: form.province.trim() || null,
          club: form.club.trim() || null,
          note: form.note.trim() || null,
        };
        if (isEdit && athleteId) {
          await updateAthlete(athleteId, payload);
          toast.success("บันทึกการแก้ไขเรียบร้อย");
        } else {
          await createAthlete(payload);
          toast.success("เพิ่มนักกีฬาเรียบร้อย");
        }
        router.push("/admin/athletes");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
          ระบุข้อมูลของนักกีฬาสำหรับใช้งานในระบบจัดการแข่งขันเดินทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ชื่อ-นามสกุล นักกีฬา <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น Somchai Rakdee"
              className="rounded-xl text-sm"
            />
            <p className="text-[11px] text-slate-500">
              ชื่อเต็ม (ใส่ชื่อและนามสกุล คั่นด้วยช่องว่าง)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">สังกัด / สโมสรหลัก</label>
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
                ประเทศ (ISO 3-letter)
              </label>
              <Input
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value.toUpperCase() }))}
                placeholder="เช่น THA, USA, JPN"
                maxLength={3}
                className="rounded-xl text-sm uppercase"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">จังหวัด (Province)</label>
              <Input
                value={form.province}
                onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                placeholder="เช่น กรุงเทพมหานคร"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                สโมสร / ทีมย่อย (Club)
              </label>
              <Input
                value={form.club}
                onChange={(e) => setForm((p) => ({ ...p, club: e.target.value }))}
                placeholder="ระบุชื่อสโมสรย่อยหรือทีมต้นสังกัด"
                className="rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-500">
                ใช้แยกย่อยจากสังกัดหลัก (เช่น สโมสรในระดับโรงเรียน/มหาวิทยาลัย)
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">หมายเหตุ (Note)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="ข้อมูลเพิ่มเติม เช่น หมายเลขเสื้อถาวร, ข้อจำกัดด้านสุขภาพ ฯลฯ"
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
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มนักกีฬา"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

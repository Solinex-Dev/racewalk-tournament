"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { createAthlete, updateAthlete } from "@/app/actions/athletes";

export type AffiliationOption = { id: string; name: string };

export type AthleteFormValues = {
  prefix: string;
  firstName: string;
  lastName: string;
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
  countryOptions: ComboboxOption[];
  provinceOptions: ComboboxOption[];
  defaultValues?: Partial<AthleteFormValues>;
};

const EMPTY: AthleteFormValues = {
  prefix: "",
  firstName: "",
  lastName: "",
  country: "TH",
  affiliationId: "",
  province: "",
  club: "",
  note: "",
};

export function AthleteForm({
  mode,
  athleteId,
  affiliations,
  countryOptions,
  provinceOptions,
  defaultValues,
}: AthleteFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AthleteFormValues>({ ...EMPTY, ...defaultValues });
  const [isPending, startTransition] = React.useTransition();

  const isEdit = mode === "edit";
  const isThai = form.country === "TH";
  const affiliationOptions: ComboboxOption[] = affiliations.map((a) => ({ value: a.id, label: a.name }));

  const set = (patch: Partial<AthleteFormValues>) => setForm((p) => ({ ...p, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      toast.error("กรุณากรอกชื่อจริง");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          prefix: form.prefix.trim() || null,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || null,
          country: form.country || "TH",
          affiliationId: form.affiliationId || null,
          province: isThai ? form.province.trim() || null : null,
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
        router.refresh();
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
          <PersonNameFields
            prefix={form.prefix}
            firstName={form.firstName}
            lastName={form.lastName}
            onChange={set}
            disabled={isPending}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">สังกัด / สโมสรหลัก</label>
              <Combobox
                options={affiliationOptions}
                value={form.affiliationId}
                onChange={(v) => set({ affiliationId: v })}
                clearable
                disabled={isPending}
                placeholder="— ไม่ระบุ —"
                searchPlaceholder="ค้นหาสังกัด…"
                emptyText="ไม่พบสังกัด"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">ประเทศ</label>
              <Combobox
                options={countryOptions}
                value={form.country}
                onChange={(v) => set({ country: v, province: v === "TH" ? form.province : "" })}
                disabled={isPending}
                placeholder="เลือกประเทศ"
                searchPlaceholder="ค้นหาประเทศ (ไทย/อังกฤษ)…"
                emptyText="ไม่พบประเทศ"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">จังหวัด</label>
              {isThai ? (
                <Combobox
                  options={provinceOptions}
                  value={form.province}
                  onChange={(v) => set({ province: v })}
                  clearable
                  disabled={isPending}
                  placeholder="— ไม่ระบุ —"
                  searchPlaceholder="ค้นหาจังหวัด…"
                  emptyText="ไม่พบจังหวัด"
                />
              ) : (
                <Input
                  value=""
                  disabled
                  placeholder="(เฉพาะนักกีฬาในประเทศไทย)"
                  className="rounded-xl text-sm"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">
                สโมสร / ทีมย่อย (Club)
              </label>
              <Input
                value={form.club}
                onChange={(e) => set({ club: e.target.value })}
                placeholder="ระบุชื่อสโมสรย่อยหรือทีมต้นสังกัด"
                className="rounded-xl text-sm"
                disabled={isPending}
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
              onChange={(e) => set({ note: e.target.value })}
              placeholder="ข้อมูลเพิ่มเติม เช่น หมายเลขเสื้อถาวร, ข้อจำกัดด้านสุขภาพ ฯลฯ"
              rows={3}
              disabled={isPending}
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

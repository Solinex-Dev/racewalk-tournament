"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { createAffiliation, updateAffiliation } from "@/app/actions/affiliations";
import { createJudge } from "@/app/actions/judges";
import { composeName } from "@/lib/person-name";

type JudgeOption = { id: string; name: string };

export type AffiliationFormValues = {
  name: string;
  country: string;
  province: string;
  headJudgeId: string;
  joinedAt: string;
  note: string;
};

type AffiliationFormProps = {
  mode: "create" | "edit";
  affiliationId?: string;
  countryOptions: ComboboxOption[];
  provinceOptions: ComboboxOption[];
  judges: JudgeOption[];
  defaultValues?: Partial<AffiliationFormValues>;
};

const EMPTY: AffiliationFormValues = {
  name: "",
  country: "TH",
  province: "",
  headJudgeId: "",
  joinedAt: "",
  note: "",
};

export function AffiliationForm({
  mode,
  affiliationId,
  countryOptions,
  provinceOptions,
  judges,
  defaultValues,
}: AffiliationFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AffiliationFormValues>({ ...EMPTY, ...defaultValues });
  const [judgeList, setJudgeList] = React.useState<JudgeOption[]>(judges);
  const [isPending, startTransition] = React.useTransition();

  // Inline "create judge as head" dialog state.
  const [judgeDialogOpen, setJudgeDialogOpen] = React.useState(false);
  const [judgeDraft, setJudgeDraft] = React.useState({ prefix: "", firstName: "", lastName: "", country: "TH" });
  const [judgeBusy, setJudgeBusy] = React.useState(false);

  const isEdit = mode === "edit";
  const isThai = form.country === "TH";
  const judgeOptions: ComboboxOption[] = judgeList.map((j) => ({ value: j.id, label: j.name }));

  const set = (patch: Partial<AffiliationFormValues>) => setForm((p) => ({ ...p, ...patch }));

  const submitJudge = async () => {
    const firstName = judgeDraft.firstName.trim();
    if (!firstName) {
      toast.error("กรุณากรอกชื่อจริงของหัวหน้าสังกัด");
      return;
    }
    setJudgeBusy(true);
    try {
      const res = await createJudge({
        prefix: judgeDraft.prefix.trim() || null,
        firstName,
        lastName: judgeDraft.lastName.trim() || null,
        country: judgeDraft.country || "TH",
        province: null,
        organizationId: null,
        departmentId: null,
        status: "ACTIVE",
        note: null,
      });
      const name = composeName({
        prefix: judgeDraft.prefix,
        firstName,
        lastName: judgeDraft.lastName,
      });
      setJudgeList((prev) => [...prev, { id: res.id, name }]);
      set({ headJudgeId: res.id });
      setJudgeDialogOpen(false);
      setJudgeDraft({ prefix: "", firstName: "", lastName: "", country: "TH" });
      toast.success("สร้างกรรมการ (หัวหน้าสังกัด) เรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setJudgeBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("กรุณากรอกชื่อสังกัด");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          name: form.name.trim(),
          country: form.country || "TH",
          province: isThai ? form.province.trim() || null : null,
          headJudgeId: form.headJudgeId || null,
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
              onChange={(e) => set({ name: e.target.value })}
              placeholder="เช่น ชมรมเดินทนกรุงเทพฯ"
              className="rounded-xl text-sm"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                <Input value="" disabled placeholder="(เฉพาะสังกัดในประเทศไทย)" className="rounded-xl text-sm" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              ผู้ดูแล / หัวหน้าสังกัด (เลือกจากกรรมการ)
            </label>
            <Combobox
              options={judgeOptions}
              value={form.headJudgeId}
              onChange={(v) => set({ headJudgeId: v })}
              clearable
              disabled={isPending}
              placeholder="— ไม่ระบุ —"
              searchPlaceholder="ค้นหากรรมการ…"
              emptyText="ไม่พบกรรมการ"
              onCreateNew={() => {
                setJudgeDraft({ prefix: "", firstName: "", lastName: "", country: "TH" });
                setJudgeDialogOpen(true);
              }}
              createNewLabel="+ สร้างกรรมการใหม่"
            />
            <p className="text-[11px] text-slate-500">
              หัวหน้าสังกัดถูกจัดเก็บเป็นรายชื่อกรรมการ — เลือกจากที่มี หรือกดสร้างใหม่ได้ทันที
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">
              วันที่เข้าร่วม / เริ่มใช้งาน (Joined at)
            </label>
            <Input
              type="date"
              value={form.joinedAt}
              onChange={(e) => set({ joinedAt: e.target.value })}
              className="rounded-xl text-sm"
              disabled={isPending}
            />
            <p className="text-[11px] text-slate-500">
              วันที่สังกัดนี้เข้าร่วมระบบหรือเริ่มใช้งาน (ตัวเลือก ใช้สำหรับอ้างอิงประวัติ)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">หมายเหตุ (Note)</label>
            <textarea
              value={form.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="รายละเอียดเพิ่มเติม เช่น ช่องทางติดต่อ, เงื่อนไขพิเศษ"
              rows={3}
              disabled={isPending}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-medium">
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มสังกัด"}
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={judgeDialogOpen} onOpenChange={setJudgeDialogOpen}>
        <DialogContent className="border-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">สร้างกรรมการ (หัวหน้าสังกัด)</DialogTitle>
            <DialogDescription className="text-left text-xs text-slate-600">
              สร้างรายชื่อกรรมการใหม่ แล้วตั้งเป็นหัวหน้าสังกัดนี้ทันที (แก้ไขรายละเอียดเพิ่มเติมภายหลังได้ในหน้ากรรมการ)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <PersonNameFields
              prefix={judgeDraft.prefix}
              firstName={judgeDraft.firstName}
              lastName={judgeDraft.lastName}
              onChange={(patch) => setJudgeDraft((p) => ({ ...p, ...patch }))}
              disabled={judgeBusy}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">ประเทศ</label>
              <Combobox
                options={countryOptions}
                value={judgeDraft.country}
                onChange={(v) => setJudgeDraft((p) => ({ ...p, country: v }))}
                disabled={judgeBusy}
                placeholder="เลือกประเทศ"
                searchPlaceholder="ค้นหาประเทศ…"
                emptyText="ไม่พบประเทศ"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              disabled={judgeBusy}
              onClick={() => setJudgeDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              disabled={judgeBusy || !judgeDraft.firstName.trim()}
              onClick={() => void submitJudge()}
            >
              {judgeBusy ? "กำลังสร้าง…" : "สร้างและตั้งเป็นหัวหน้า"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

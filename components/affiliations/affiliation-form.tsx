"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
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
import { DetailField } from "@/components/common/detail-field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { createAffiliation, updateAffiliation, deleteAffiliation } from "@/app/actions/affiliations";
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
  canEdit?: boolean;
  canDelete?: boolean;
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
  canEdit = false,
  canDelete = false,
  defaultValues,
}: Readonly<AffiliationFormProps>) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [saved, setSaved] = React.useState<AffiliationFormValues>({ ...EMPTY, ...defaultValues });
  const [form, setForm] = React.useState<AffiliationFormValues>(saved);
  const [editing, setEditing] = React.useState(!isEdit);
  const [judgeList, setJudgeList] = React.useState<JudgeOption[]>(judges);
  const [isPending, startTransition] = React.useTransition();

  const [judgeDialogOpen, setJudgeDialogOpen] = React.useState(false);
  const [judgeDraft, setJudgeDraft] = React.useState({ prefix: "", firstName: "", middleName: "", lastName: "", country: "TH" });
  const [judgeBusy, setJudgeBusy] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const isThai = form.country === "TH";
  const judgeOptions: ComboboxOption[] = judgeList.map((j) => ({ value: j.id, label: j.name }));
  const set = (patch: Partial<AffiliationFormValues>) => setForm((p) => ({ ...p, ...patch }));
  const submitLabel = isEdit ? "บันทึกการแก้ไข" : "เพิ่มสังกัด";

  const labelOf = (opts: ComboboxOption[], value: string) => opts.find((o) => o.value === value)?.label ?? value;
  const headName = (id: string) => judgeList.find((j) => j.id === id)?.name ?? "";

  const startEdit = () => {
    setForm(saved);
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(saved);
    setEditing(false);
  };

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
        middleName: judgeDraft.middleName.trim() || null,
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
        middleName: judgeDraft.middleName,
        lastName: judgeDraft.lastName,
      });
      setJudgeList((prev) => [...prev, { id: res.id, name }]);
      set({ headJudgeId: res.id });
      setJudgeDialogOpen(false);
      setJudgeDraft({ prefix: "", firstName: "", middleName: "", lastName: "", country: "TH" });
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
          setSaved(form);
          setEditing(false);
          toast.success("บันทึกการแก้ไขเรียบร้อย");
          router.refresh();
        } else {
          await createAffiliation(payload);
          toast.success("เพิ่มสังกัดเรียบร้อย");
          router.push("/admin/affiliations");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = () => {
    if (!affiliationId) return;
    startTransition(async () => {
      try {
        await deleteAffiliation(affiliationId);
        toast.success("ลบสังกัดเรียบร้อย");
        setDeleteOpen(false);
        router.push("/admin/affiliations");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-slate-200 py-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-900">
            {isEdit ? "ข้อมูลสังกัด / สโมสร" : "เพิ่มสังกัด / สโมสรใหม่"}
          </CardTitle>
          <p className="text-xs text-slate-600">จัดการข้อมูลสังกัด / สโมสร เช่น ชมรม มหาวิทยาลัย หรือทีมตัวแทน</p>
        </div>
        {isEdit && !editing && (
          <div className="flex shrink-0 gap-2">
            {canEdit && (
              <Button type="button" variant="outline" size="sm" onClick={startEdit} className="gap-1.5 rounded-lg border-slate-200 text-xs">
                <Pencil className="h-3.5 w-3.5" /> แก้ไข
              </Button>
            )}
            {canDelete && (
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setDeleteOpen(true)} className="gap-1.5 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> ลบ
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="py-4">
        {editing ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="affiliation-name" className="block text-xs font-medium text-slate-800">
                ชื่อสังกัด / สโมสร <span className="text-red-500">*</span>
              </label>
              <Input
                id="affiliation-name"
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
                <label htmlFor="affiliation-country" className="block text-xs font-medium text-slate-800">ประเทศ</label>
                <Combobox
                  id="affiliation-country"
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
                <label htmlFor="affiliation-province" className="block text-xs font-medium text-slate-800">จังหวัด</label>
                {isThai ? (
                  <Combobox
                    id="affiliation-province"
                    options={provinceOptions}
                    value={form.province}
                    onChange={(v) => set({ province: v })}
                    clearable
                    disabled={isPending}
                    placeholder="ไม่ระบุ"
                    searchPlaceholder="ค้นหาจังหวัด…"
                    emptyText="ไม่พบจังหวัด"
                  />
                ) : (
                  <Input id="affiliation-province" value="" disabled placeholder="(เฉพาะสังกัดในประเทศไทย)" className="rounded-xl text-sm" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="affiliation-head-judge" className="block text-xs font-medium text-slate-800">ผู้ดูแล / หัวหน้าสังกัด (เลือกจากกรรมการ)</label>
              <Combobox
                id="affiliation-head-judge"
                options={judgeOptions}
                value={form.headJudgeId}
                onChange={(v) => set({ headJudgeId: v })}
                clearable
                disabled={isPending}
                placeholder="ไม่ระบุ"
                searchPlaceholder="ค้นหากรรมการ…"
                emptyText="ไม่พบกรรมการ"
                onCreateNew={() => {
                  setJudgeDraft({ prefix: "", firstName: "", middleName: "", lastName: "", country: "TH" });
                  setJudgeDialogOpen(true);
                }}
                createNewLabel="สร้างกรรมการใหม่"
              />
              <p className="text-[11px] text-slate-500">
                หัวหน้าสังกัดถูกจัดเก็บเป็นรายชื่อกรรมการ — เลือกจากที่มี หรือกดสร้างใหม่ได้ทันที
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="affiliation-joined-at" className="block text-xs font-medium text-slate-800">วันที่เข้าร่วม / เริ่มใช้งาน (Joined at)</label>
              <Input
                id="affiliation-joined-at"
                type="date"
                value={form.joinedAt}
                onChange={(e) => set({ joinedAt: e.target.value })}
                className="rounded-xl text-sm"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="affiliation-note" className="block text-xs font-medium text-slate-800">หมายเหตุ (Note)</label>
              <textarea
                id="affiliation-note"
                value={form.note}
                onChange={(e) => set({ note: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม เช่น ช่องทางติดต่อ, เงื่อนไขพิเศษ"
                rows={3}
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {isEdit && (
                <Button type="button" variant="outline" disabled={isPending} onClick={cancelEdit} className="rounded-xl px-4 py-2 text-sm">
                  ยกเลิก
                </Button>
              )}
              <Button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-medium">
                {isPending ? "กำลังบันทึก..." : submitLabel}
              </Button>
            </div>
          </form>
        ) : (
          <dl>
            <DetailField label="ชื่อสังกัด / สโมสร" value={saved.name} />
            <DetailField label="ประเทศ" value={labelOf(countryOptions, saved.country)} />
            <DetailField label="จังหวัด" value={saved.province} />
            <DetailField label="ผู้ดูแล / หัวหน้าสังกัด" value={headName(saved.headJudgeId)} />
            <DetailField label="วันที่เข้าร่วม" value={saved.joinedAt} />
            <DetailField label="หมายเหตุ" value={saved.note} />
          </dl>
        )}
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
              middleName={judgeDraft.middleName}
              lastName={judgeDraft.lastName}
              onChange={(patch) => setJudgeDraft((p) => ({ ...p, ...patch }))}
              disabled={judgeBusy}
            />
            <div className="space-y-1.5">
              <label htmlFor="affiliation-judge-country" className="block text-xs font-medium text-slate-800">ประเทศ</label>
              <Combobox
                id="affiliation-judge-country"
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
            <Button type="button" variant="outline" className="rounded-xl border-slate-200" disabled={judgeBusy} onClick={() => setJudgeDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="button" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={judgeBusy || !judgeDraft.firstName.trim()} onClick={() => void submitJudge()}>
              {judgeBusy ? "กำลังสร้าง…" : "สร้างและตั้งเป็นหัวหน้า"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="ลบสังกัด"
        description={
          <>
            ต้องการลบ <span className="font-medium text-slate-900">{saved.name}</span>{" "}
            ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้
          </>
        }
        destructive
        confirmText="ลบ"
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

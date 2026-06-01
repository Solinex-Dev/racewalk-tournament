"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { DetailField } from "@/components/common/detail-field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { createAthlete, updateAthlete, deleteAthlete } from "@/app/actions/athletes";
import { composeName } from "@/lib/person-name";

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
  canEdit?: boolean;
  canDelete?: boolean;
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
  canEdit = false,
  canDelete = false,
  defaultValues,
}: AthleteFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [saved, setSaved] = React.useState<AthleteFormValues>({ ...EMPTY, ...defaultValues });
  const [form, setForm] = React.useState<AthleteFormValues>(saved);
  const [editing, setEditing] = React.useState(!isEdit);
  const [isPending, startTransition] = React.useTransition();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const isThai = form.country === "TH";
  const affiliationOptions: ComboboxOption[] = affiliations.map((a) => ({ value: a.id, label: a.name }));
  const set = (patch: Partial<AthleteFormValues>) => setForm((p) => ({ ...p, ...patch }));

  const labelOf = (opts: ComboboxOption[], value: string) =>
    opts.find((o) => o.value === value)?.label ?? value;

  const startEdit = () => {
    setForm(saved);
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(saved);
    setEditing(false);
  };

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
          setSaved(form);
          setEditing(false);
          toast.success("บันทึกการแก้ไขเรียบร้อย");
          router.refresh();
        } else {
          await createAthlete(payload);
          toast.success("เพิ่มนักกีฬาเรียบร้อย");
          router.push("/admin/athletes");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = () => {
    if (!athleteId) return;
    startTransition(async () => {
      try {
        await deleteAthlete(athleteId);
        toast.success("ลบนักกีฬาเรียบร้อย");
        setDeleteOpen(false);
        router.push("/admin/athletes");
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
            {isEdit ? "ข้อมูลนักกีฬา" : "เพิ่มนักกีฬาใหม่"}
          </CardTitle>
          <p className="text-xs text-slate-600">
            ระบุข้อมูลของนักกีฬาสำหรับใช้งานในระบบจัดการแข่งขันเดินทน
          </p>
        </div>
        {isEdit && !editing && (
          <div className="flex shrink-0 gap-2">
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startEdit}
                className="gap-1.5 rounded-lg border-slate-200 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" /> แก้ไข
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDeleteOpen(true)}
                className="gap-1.5 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> ลบ
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="py-4">
        {!editing ? (
          <dl>
            <DetailField label="ชื่อ-นามสกุล" value={composeName(saved)} />
            <DetailField label="สังกัด / สโมสรหลัก" value={labelOf(affiliationOptions, saved.affiliationId)} />
            <DetailField label="ประเทศ" value={labelOf(countryOptions, saved.country)} />
            <DetailField label="จังหวัด" value={saved.province} />
            <DetailField label="สโมสร / ทีมย่อย" value={saved.club} />
            <DetailField label="หมายเหตุ" value={saved.note} />
          </dl>
        ) : (
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
                  <Input value="" disabled placeholder="(เฉพาะนักกีฬาในประเทศไทย)" className="rounded-xl text-sm" />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-800">สโมสร / ทีมย่อย (Club)</label>
                <Input
                  value={form.club}
                  onChange={(e) => set({ club: e.target.value })}
                  placeholder="ระบุชื่อสโมสรย่อยหรือทีมต้นสังกัด"
                  className="rounded-xl text-sm"
                  disabled={isPending}
                />
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
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={cancelEdit}
                  className="rounded-xl px-4 py-2 text-sm"
                >
                  ยกเลิก
                </Button>
              )}
              <Button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-medium">
                {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มนักกีฬา"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="ลบนักกีฬา"
        description={
          <>
            ต้องการลบ <span className="font-medium text-slate-900">{composeName(saved)}</span>{" "}
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

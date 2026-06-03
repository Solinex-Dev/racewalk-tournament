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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { DetailField } from "@/components/common/detail-field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { createJudge, updateJudge, deleteJudge } from "@/app/actions/judges";
import { createOrganization, createDepartment } from "@/app/actions/organizations";
import { composeName } from "@/lib/person-name";

type OrgNode = { id: string; name: string; departments: { id: string; name: string }[] };

export type JudgeFormValues = {
  prefix: string;
  firstName: string;
  lastName: string;
  country: string;
  province: string;
  organizationId: string;
  departmentId: string;
  status: "ACTIVE" | "INACTIVE";
  note: string;
};

type JudgeFormProps = {
  mode: "create" | "edit";
  judgeId?: string;
  countryOptions: ComboboxOption[];
  provinceOptions: ComboboxOption[];
  organizations: OrgNode[];
  canEdit?: boolean;
  canDelete?: boolean;
  defaultValues?: Partial<JudgeFormValues>;
};

const EMPTY: JudgeFormValues = {
  prefix: "",
  firstName: "",
  lastName: "",
  country: "TH",
  province: "",
  organizationId: "",
  departmentId: "",
  status: "ACTIVE",
  note: "",
};

export function JudgeForm({
  mode,
  judgeId,
  countryOptions,
  provinceOptions,
  organizations,
  canEdit = false,
  canDelete = false,
  defaultValues,
}: Readonly<JudgeFormProps>) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [saved, setSaved] = React.useState<JudgeFormValues>({ ...EMPTY, ...defaultValues });
  const [form, setForm] = React.useState<JudgeFormValues>(saved);
  const [editing, setEditing] = React.useState(!isEdit);
  const [orgs, setOrgs] = React.useState<OrgNode[]>(organizations);
  const [isPending, startTransition] = React.useTransition();

  const [creating, setCreating] = React.useState<null | "org" | "department">(null);
  const [createName, setCreateName] = React.useState("");
  const [createBusy, setCreateBusy] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const isThai = form.country === "TH";
  const set = (patch: Partial<JudgeFormValues>) => setForm((p) => ({ ...p, ...patch }));
  const submitLabel = isEdit ? "บันทึกการแก้ไข" : "เพิ่มกรรมการ";

  const orgOptions: ComboboxOption[] = orgs.map((o) => ({ value: o.id, label: o.name }));
  const selectedOrg = orgs.find((o) => o.id === form.organizationId);
  const deptOptions: ComboboxOption[] = (selectedOrg?.departments ?? []).map((d) => ({ value: d.id, label: d.name }));

  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? "";
  const deptName = (orgId: string, id: string) =>
    orgs.find((o) => o.id === orgId)?.departments.find((d) => d.id === id)?.name ?? "";
  const labelOf = (opts: ComboboxOption[], value: string) =>
    opts.find((o) => o.value === value)?.label ?? value;

  const onSelectOrg = (orgId: string) => set({ organizationId: orgId, departmentId: "" });

  const startEdit = () => {
    setForm(saved);
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(saved);
    setEditing(false);
  };

  const submitCreate = async () => {
    const name = createName.trim();
    if (!name) return;
    setCreateBusy(true);
    try {
      if (creating === "org") {
        const org = await createOrganization({ name });
        setOrgs((prev) => [...prev, { id: org.id, name: org.name, departments: [] }]);
        set({ organizationId: org.id, departmentId: "" });
        toast.success("สร้างองค์กรเรียบร้อย");
      } else if (creating === "department") {
        if (!form.organizationId) return;
        const dept = await createDepartment({ organizationId: form.organizationId, name });
        setOrgs((prev) =>
          prev.map((o) =>
            o.id === dept.organizationId
              ? { ...o, departments: [...o.departments, { id: dept.id, name: dept.name }] }
              : o,
          ),
        );
        set({ departmentId: dept.id });
        toast.success("สร้างแผนกเรียบร้อย");
      }
      setCreating(null);
      setCreateName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setCreateBusy(false);
    }
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
          province: isThai ? form.province.trim() || null : null,
          organizationId: form.organizationId || null,
          departmentId: form.departmentId || null,
          status: form.status,
          note: form.note.trim() || null,
        };
        if (isEdit && judgeId) {
          await updateJudge(judgeId, payload);
          setSaved(form);
          setEditing(false);
          toast.success("บันทึกการแก้ไขเรียบร้อย");
          router.refresh();
        } else {
          await createJudge(payload);
          toast.success("เพิ่มกรรมการเรียบร้อย");
          router.push("/admin/judges");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = () => {
    if (!judgeId) return;
    startTransition(async () => {
      try {
        await deleteJudge(judgeId);
        toast.success("ลบกรรมการเรียบร้อย");
        setDeleteOpen(false);
        router.push("/admin/judges");
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
            {isEdit ? "ข้อมูลกรรมการ" : "เพิ่มกรรมการใหม่"}
          </CardTitle>
          <p className="text-xs text-slate-600">
            ระบุข้อมูลของกรรมการ เพื่อใช้กำหนดเข้ารอบแข่งและออกรหัสกรรมการสำหรับ login ในวันแข่ง
          </p>
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
            <PersonNameFields
              prefix={form.prefix}
              firstName={form.firstName}
              lastName={form.lastName}
              onChange={set}
              disabled={isPending}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="judge-country" className="block text-xs font-medium text-slate-800">ประเทศ</label>
                <Combobox
                  id="judge-country"
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
                <label htmlFor="judge-province" className="block text-xs font-medium text-slate-800">จังหวัด</label>
                {isThai ? (
                  <Combobox
                    id="judge-province"
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
                  <Input id="judge-province" value="" disabled placeholder="(เฉพาะกรรมการในประเทศไทย)" className="rounded-xl text-sm" />
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="judge-organization" className="block text-xs font-medium text-slate-800">องค์กร / สังกัด</label>
                <Combobox
                  id="judge-organization"
                  options={orgOptions}
                  value={form.organizationId}
                  onChange={onSelectOrg}
                  clearable
                  disabled={isPending}
                  placeholder="ไม่ระบุ"
                  searchPlaceholder="ค้นหาองค์กร…"
                  emptyText="ไม่พบองค์กร"
                  onCreateNew={() => {
                    setCreateName("");
                    setCreating("org");
                  }}
                  createNewLabel="สร้างองค์กรใหม่"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="judge-department" className="block text-xs font-medium text-slate-800">แผนก / หน่วยงาน</label>
                <Combobox
                  id="judge-department"
                  options={deptOptions}
                  value={form.departmentId}
                  onChange={(v) => set({ departmentId: v })}
                  clearable
                  disabled={isPending || !form.organizationId}
                  placeholder={form.organizationId ? "ไม่ระบุ" : "เลือกองค์กรก่อน"}
                  searchPlaceholder="ค้นหาแผนก…"
                  emptyText="ยังไม่มีแผนกในองค์กรนี้"
                  onCreateNew={
                    form.organizationId
                      ? () => {
                          setCreateName("");
                          setCreating("department");
                        }
                      : undefined
                  }
                  createNewLabel="+ สร้างแผนกใหม่"
                />
                <p className="text-[11px] text-slate-500">แผนกจะอยู่ภายใต้องค์กรที่เลือกไว้</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-800">สถานะการใช้งาน</span>
              <div className="flex gap-3 text-xs">
                <label className="inline-flex cursor-pointer items-center gap-1.5">
                  <input type="radio" name="status" value="ACTIVE" checked={form.status === "ACTIVE"} onChange={() => set({ status: "ACTIVE" })} className="h-3.5 w-3.5 accent-slate-900" />
                  <span>ใช้งานอยู่</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5">
                  <input type="radio" name="status" value="INACTIVE" checked={form.status === "INACTIVE"} onChange={() => set({ status: "INACTIVE" })} className="h-3.5 w-3.5 accent-slate-900" />
                  <span>ปิดการใช้งาน</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                กรรมการที่ปิดการใช้งานจะไม่ปรากฏใน dropdown ตอนสร้างรอบแข่ง (แต่ข้อมูลยังคงอยู่)
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="judge-note" className="block text-xs font-medium text-slate-800">หมายเหตุ (Note)</label>
              <textarea
                id="judge-note"
                value={form.note}
                onChange={(e) => set({ note: e.target.value })}
                placeholder="ข้อมูลเพิ่มเติม เช่น ความเชี่ยวชาญ, ประสบการณ์, ข้อจำกัดเฉพาะ"
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
            <DetailField label="ชื่อ-นามสกุล" value={composeName(saved)} />
            <DetailField label="ประเทศ" value={labelOf(countryOptions, saved.country)} />
            <DetailField label="จังหวัด" value={saved.province} />
            <DetailField label="องค์กร / สังกัด" value={orgName(saved.organizationId)} />
            <DetailField label="แผนก / หน่วยงาน" value={deptName(saved.organizationId, saved.departmentId)} />
            <DetailField label="สถานะการใช้งาน" value={saved.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดการใช้งาน"} />
            <DetailField label="หมายเหตุ" value={saved.note} />
          </dl>
        )}
      </CardContent>

      <Dialog open={creating !== null} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent className="border-slate-200 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">
              {creating === "org" ? "สร้างองค์กรใหม่" : "สร้างแผนกใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <label className="block text-xs font-medium text-slate-800">
              {creating === "org" ? "ชื่อองค์กร" : `ชื่อแผนก (ในองค์กร: ${selectedOrg?.name ?? ""})`}
            </label>
            <Input
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitCreate();
                }
              }}
              placeholder={creating === "org" ? "เช่น สมาคมกรีฑาแห่งประเทศไทย" : "เช่น ฝ่ายกรรมการสนาม"}
              className="rounded-xl text-sm"
              disabled={createBusy}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="rounded-xl border-slate-200" disabled={createBusy} onClick={() => setCreating(null)}>
              ยกเลิก
            </Button>
            <Button type="button" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={createBusy || !createName.trim()} onClick={() => void submitCreate()}>
              {createBusy ? "กำลังสร้าง…" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="ลบกรรมการ"
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

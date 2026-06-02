"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { DetailField } from "@/components/common/detail-field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { createAdmin, updateAdmin, deleteAdmin } from "@/app/actions/admins";
import { composeName } from "@/lib/person-name";
import {
  ACTIONS,
  ACTION_LABELS,
  RESOURCES,
  RESOURCE_LABELS,
  emptyPermissions,
  fullPermissions,
  normalizePermissions,
  RESOURCE_ACTIONS,
  resourceAllows,
  type Action,
  type PermissionMatrix,
  type Resource,
} from "@/lib/permissions";

export type AdminFormValues = {
  prefix: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  password: string;
  status: "ACTIVE" | "SUSPENDED";
  isRoot: boolean;
  permissions: PermissionMatrix;
};

type AdminFormProps = {
  mode: "create" | "edit";
  adminId?: string;
  currentUserIsRoot: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  defaultValues?: Partial<AdminFormValues>;
};

function initValues(d?: Partial<AdminFormValues>): AdminFormValues {
  return {
    prefix: d?.prefix ?? "",
    firstName: d?.firstName ?? "",
    lastName: d?.lastName ?? "",
    email: d?.email ?? "",
    title: d?.title ?? "",
    password: "",
    status: d?.status ?? "ACTIVE",
    isRoot: d?.isRoot ?? false,
    permissions: normalizePermissions(d?.permissions),
  };
}

export function AdminForm({
  mode,
  adminId,
  currentUserIsRoot,
  canEdit = false,
  canDelete = false,
  defaultValues,
}: AdminFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [saved, setSaved] = React.useState<AdminFormValues>(() => initValues(defaultValues));
  const [form, setForm] = React.useState<AdminFormValues>(saved);
  const [editing, setEditing] = React.useState(!isEdit);
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const matrixDisabled = form.isRoot || isPending;
  const set = (patch: Partial<AdminFormValues>) => setForm((p) => ({ ...p, ...patch }));

  const startEdit = () => {
    setForm({ ...saved, password: "" });
    setError(null);
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm({ ...saved, password: "" });
    setError(null);
    setEditing(false);
  };

  const togglePerm = (r: Resource, a: Action) =>
    setForm((p) => ({
      ...p,
      permissions: { ...p.permissions, [r]: { ...p.permissions[r], [a]: !p.permissions[r][a] } },
    }));
  const toggleRow = (r: Resource) =>
    setForm((p) => {
      const allowed = RESOURCE_ACTIONS[r];
      const allOn = allowed.every((a) => p.permissions[r][a]);
      const next = { view: false, create: false, edit: false, delete: false };
      for (const a of allowed) next[a] = !allOn;
      return { ...p, permissions: { ...p.permissions, [r]: next } };
    });
  const setAll = (value: boolean) => setForm((p) => ({ ...p, permissions: value ? fullPermissions() : emptyPermissions() }));

  const grantedResources = RESOURCES.filter((r) => ACTIONS.some((a) => saved.permissions[r][a]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim()) {
      setError("กรุณากรอกชื่อจริง");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          prefix: form.prefix.trim() || null,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || null,
          email: form.email.trim(),
          title: form.title.trim(),
          password: form.password,
          status: form.status,
          isRoot: form.isRoot,
          permissions: form.permissions,
        };
        if (isEdit && adminId) {
          await updateAdmin(adminId, payload);
          setSaved({ ...form, password: "" });
          setEditing(false);
          router.refresh();
        } else {
          await createAdmin(payload);
          router.push("/admin/admins");
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = () => {
    if (!adminId) return;
    startTransition(async () => {
      try {
        await deleteAdmin(adminId);
        setDeleteOpen(false);
        router.push("/admin/admins");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-slate-200 py-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-900">
            {isEdit ? "ข้อมูล Admin" : "สร้าง Admin ใหม่"}
          </CardTitle>
          <p className="text-xs text-slate-600">ระบุข้อมูลและสิทธิ์การเข้าถึงของผู้ดูแลระบบ</p>
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
        {!editing ? (
          <dl>
            <DetailField label="ชื่อ-นามสกุล" value={composeName(saved)} />
            <DetailField label="อีเมล" value={saved.email} />
            <DetailField label="บทบาท (ป้าย)" value={saved.title} />
            <DetailField label="สถานะ" value={saved.status === "ACTIVE" ? "ใช้งานอยู่" : "ระงับการใช้งาน"} />
            <DetailField
              label="สิทธิ์การเข้าถึง"
              value={
                saved.isRoot ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> Root Admin — เข้าถึงทุกอย่าง
                  </span>
                ) : grantedResources.length === 0 ? (
                  "— ไม่มีสิทธิ์ —"
                ) : (
                  <ul className="space-y-0.5">
                    {grantedResources.map((r) => (
                      <li key={r} className="text-xs">
                        <span className="font-medium text-slate-700">{RESOURCE_LABELS[r]}:</span>{" "}
                        {ACTIONS.filter((a) => saved.permissions[r][a]).map((a) => ACTION_LABELS[a]).join(", ")}
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </dl>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PersonNameFields prefix={form.prefix} firstName={form.firstName} lastName={form.lastName} onChange={set} disabled={isPending} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-800">อีเมล</label>
                <Input required type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="admin@example.com" className="rounded-xl text-sm" disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-800">บทบาท (ป้ายแสดงผล)</label>
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="เช่น Owner, Event Manager, Score Officer" className="rounded-xl text-sm" disabled={isPending} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">รหัสผ่าน</label>
              <Input
                required={!isEdit}
                type="password"
                value={form.password}
                onChange={(e) => set({ password: e.target.value })}
                placeholder={isEdit ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "กำหนดรหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัว)"}
                className="rounded-xl text-sm"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-800">สถานะการใช้งาน</span>
              <div className="flex gap-3 text-xs">
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" name="status" value="ACTIVE" checked={form.status === "ACTIVE"} onChange={() => set({ status: "ACTIVE" })} className="h-3.5 w-3.5 accent-slate-900" />
                  <span>ใช้งานอยู่</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" name="status" value="SUSPENDED" checked={form.status === "SUSPENDED"} onChange={() => set({ status: "SUSPENDED" })} className="h-3.5 w-3.5 accent-slate-900" />
                  <span>ระงับการใช้งาน</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">สิทธิ์การเข้าถึง (Permissions)</span>
                {!form.isRoot && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setAll(true)} disabled={matrixDisabled} className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50">
                      เลือกทั้งหมด
                    </button>
                    <button type="button" onClick={() => setAll(false)} disabled={matrixDisabled} className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50">
                      ล้างทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {currentUserIsRoot && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                  <input type="checkbox" checked={form.isRoot} onChange={(e) => set({ isRoot: e.target.checked })} disabled={isPending} className="h-4 w-4 accent-amber-600" />
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">Root Admin — เข้าถึงและจัดการได้ทุกอย่าง (ข้ามสิทธิ์ทั้งหมด)</span>
                </label>
              )}

              {form.isRoot ? (
                <p className="px-1 py-2 text-xs text-slate-500">Root Admin มีสิทธิ์เต็มทุกหมวดโดยอัตโนมัติ</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">หมวด</th>
                        {ACTIONS.map((a) => (
                          <th key={a} className="px-2 py-1.5 text-center font-medium">{ACTION_LABELS[a]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {RESOURCES.map((r) => (
                        <tr key={r} className="hover:bg-slate-50/60">
                          <td className="px-2 py-1.5">
                            <button type="button" onClick={() => toggleRow(r)} disabled={matrixDisabled} className="text-left font-medium text-slate-700 hover:underline">
                              {RESOURCE_LABELS[r]}
                            </button>
                          </td>
                          {ACTIONS.map((a) => (
                            <td key={a} className="px-2 py-1.5 text-center">
                              {resourceAllows(r, a) ? (
                                <input type="checkbox" checked={form.permissions[r][a]} onChange={() => togglePerm(r, a)} disabled={matrixDisabled} className="h-4 w-4 accent-slate-900" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              {isEdit && (
                <Button type="button" variant="outline" disabled={isPending} onClick={cancelEdit} className="rounded-xl px-4 py-2 text-sm">
                  ยกเลิก
                </Button>
              )}
              <Button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-medium">
                {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "สร้าง Admin"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="ลบผู้ดูแล"
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

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { createAdmin, updateAdmin } from "@/app/actions/admins";
import {
  ACTIONS,
  ACTION_LABELS,
  RESOURCES,
  RESOURCE_LABELS,
  emptyPermissions,
  fullPermissions,
  normalizePermissions,
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
  /** Whether the signed-in admin is Root (only Root can grant Root). */
  currentUserIsRoot: boolean;
  defaultValues?: Partial<AdminFormValues>;
};

export function AdminForm({ mode, adminId, currentUserIsRoot, defaultValues }: AdminFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AdminFormValues>(() => ({
    prefix: defaultValues?.prefix ?? "",
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    title: defaultValues?.title ?? "",
    password: "",
    status: defaultValues?.status ?? "ACTIVE",
    isRoot: defaultValues?.isRoot ?? false,
    permissions: normalizePermissions(defaultValues?.permissions),
  }));
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const isEdit = mode === "edit";
  const matrixDisabled = form.isRoot || isPending;

  const set = (patch: Partial<AdminFormValues>) => setForm((p) => ({ ...p, ...patch }));

  const togglePerm = (r: Resource, a: Action) =>
    setForm((p) => ({
      ...p,
      permissions: { ...p.permissions, [r]: { ...p.permissions[r], [a]: !p.permissions[r][a] } },
    }));

  const toggleRow = (r: Resource) =>
    setForm((p) => {
      const allOn = ACTIONS.every((a) => p.permissions[r][a]);
      const next = { view: !allOn, create: !allOn, edit: !allOn, delete: !allOn };
      return { ...p, permissions: { ...p.permissions, [r]: next } };
    });

  const setAll = (value: boolean) =>
    setForm((p) => ({ ...p, permissions: value ? fullPermissions() : emptyPermissions() }));

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
        } else {
          await createAdmin(payload);
        }
        router.push("/admin/admins");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader className="space-y-1 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">
          {isEdit ? "แก้ไขข้อมูล Admin" : "สร้าง Admin ใหม่"}
        </CardTitle>
        <p className="text-xs text-slate-600">
          ระบุข้อมูลและสิทธิ์การเข้าถึงของผู้ดูแลระบบสำหรับจัดการการแข่งขันเดินทน
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
              <label className="block text-xs font-medium text-slate-800">อีเมล</label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="admin@example.com"
                className="rounded-xl text-sm"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-800">บทบาท (ป้ายแสดงผล)</label>
              <Input
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="เช่น Owner, Event Manager, Score Officer"
                className="rounded-xl text-sm"
                disabled={isPending}
              />
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
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={form.status === "ACTIVE"}
                  onChange={() => set({ status: "ACTIVE" })}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ใช้งานอยู่</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="status"
                  value="SUSPENDED"
                  checked={form.status === "SUSPENDED"}
                  onChange={() => set({ status: "SUSPENDED" })}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ระงับการใช้งาน</span>
              </label>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">สิทธิ์การเข้าถึง (Permissions)</span>
              {!form.isRoot && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAll(true)}
                    disabled={matrixDisabled}
                    className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setAll(false)}
                    disabled={matrixDisabled}
                    className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
            </div>

            {currentUserIsRoot && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                <input
                  type="checkbox"
                  checked={form.isRoot}
                  onChange={(e) => set({ isRoot: e.target.checked })}
                  disabled={isPending}
                  className="h-4 w-4 accent-amber-600"
                />
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-800">
                  Root Admin — เข้าถึงและจัดการได้ทุกอย่าง (ข้ามสิทธิ์ทั้งหมด)
                </span>
              </label>
            )}

            {form.isRoot ? (
              <p className="px-1 py-2 text-xs text-slate-500">
                Root Admin มีสิทธิ์เต็มทุกหมวดโดยอัตโนมัติ
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">หมวด</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className="px-2 py-1.5 text-center font-medium">
                          {ACTION_LABELS[a]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RESOURCES.map((r) => (
                      <tr key={r} className="hover:bg-slate-50/60">
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => toggleRow(r)}
                            disabled={matrixDisabled}
                            className="text-left font-medium text-slate-700 hover:underline"
                          >
                            {RESOURCE_LABELS[r]}
                          </button>
                        </td>
                        {ACTIONS.map((a) => (
                          <td key={a} className="px-2 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={form.permissions[r][a]}
                              onChange={() => togglePerm(r, a)}
                              disabled={matrixDisabled}
                              className="h-4 w-4 accent-slate-900"
                            />
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
            <Button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-medium">
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "สร้าง Admin"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

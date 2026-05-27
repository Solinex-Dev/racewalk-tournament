"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdmin, updateAdmin } from "@/app/actions/admins";

export type AdminFormValues = {
  name: string;
  email: string;
  title: string;
  password: string;
  status: "ACTIVE" | "SUSPENDED";
};

type AdminFormProps = {
  mode: "create" | "edit";
  adminId?: string;
  defaultValues?: Partial<AdminFormValues>;
};

const EMPTY: AdminFormValues = {
  name: "",
  email: "",
  title: "",
  password: "",
  status: "ACTIVE",
};

export function AdminForm({ mode, adminId, defaultValues }: AdminFormProps) {
  const router = useRouter();
  const [form, setForm] = React.useState<AdminFormValues>({ ...EMPTY, ...defaultValues, password: "" });
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
          email: form.email.trim(),
          title: form.title.trim(),
          password: form.password,
          status: form.status,
        };
        if (isEdit && adminId) {
          await updateAdmin(adminId, payload);
        } else {
          await createAdmin(payload);
        }
        router.push("/admin/admins");
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
          ระบุข้อมูลพื้นฐานของผู้ดูแลระบบสำหรับจัดการการแข่งขันเดินทน
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">ชื่อแสดงผล</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="เช่น ผู้ดูแลระบบ"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">อีเมล</label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="admin@example.com"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">รหัสผ่าน</label>
            <Input
              required={!isEdit}
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder={isEdit ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "กำหนดรหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัว)"}
              className="rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-800">บทบาท (Display label)</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="เช่น Owner, Event Manager, Score Officer"
              className="rounded-xl text-sm"
            />
            <p className="text-[11px] text-slate-500">
              ป้ายข้อความที่ใช้แสดงในตาราง Admin (ทุกคนได้สิทธิ์ ADMIN เท่ากันในระบบ)
            </p>
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
                  onChange={() => setForm((p) => ({ ...p, status: "ACTIVE" }))}
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
                  onChange={() => setForm((p) => ({ ...p, status: "SUSPENDED" }))}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <span>ระงับการใช้งาน</span>
              </label>
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
              {isPending ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "สร้าง Admin"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

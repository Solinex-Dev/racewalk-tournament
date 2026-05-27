"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateMyProfile, changeMyPassword } from "@/app/actions/profile";

type Props = {
  defaultName: string;
  defaultEmail: string;
  defaultTitle: string;
};

export function ProfileForm({ defaultName, defaultEmail, defaultTitle }: Props) {
  const router = useRouter();
  const [name, setName] = React.useState(defaultName);
  const [email, setEmail] = React.useState(defaultEmail);
  const [title, setTitle] = React.useState(defaultTitle);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateMyProfile({ name, email, title });
        toast.success("บันทึกโปรไฟล์เรียบร้อย");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("กรุณากรอกทั้งรหัสผ่านปัจจุบันและรหัสผ่านใหม่");
      return;
    }
    startTransition(async () => {
      try {
        await changeMyPassword(currentPassword, newPassword);
        toast.success("เปลี่ยนรหัสผ่านเรียบร้อย");
        setCurrentPassword("");
        setNewPassword("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardContent className="space-y-6 p-6">
        <form className="space-y-4" onSubmit={handleProfileSubmit}>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">ข้อมูลโปรไฟล์</h2>
            <p className="text-xs text-slate-500">
              ใช้สำหรับแสดงชื่อและล็อกอินเข้าระบบ
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">ชื่อแสดงผล</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-slate-200 text-sm"
              placeholder="เช่น ผู้ดูแลระบบ"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">บทบาท (label)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-slate-200 text-sm"
              placeholder="เช่น Owner, Event Manager"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">อีเมลสำหรับล็อกอิน</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-slate-200 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              บันทึกโปรไฟล์
            </Button>
          </div>
        </form>

        <form
          className="space-y-4 border-t border-dashed border-slate-200 pt-6"
          onSubmit={handlePasswordSubmit}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
            <p className="text-xs text-slate-500">
              อย่างน้อย 8 ตัวอักษร ห้ามซ้ำกับรหัสผ่านเดิม
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">รหัสผ่านปัจจุบัน</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">รหัสผ่านใหม่</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border-slate-200 text-sm"
                minLength={8}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium"
            >
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

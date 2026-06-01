"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateMyProfile, changeMyPassword } from "@/app/actions/profile";
import { PersonNameFields } from "@/components/common/person-name-fields";
import { composeName } from "@/lib/person-name";

type Props = {
  defaultPrefix: string;
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultTitle: string;
};

/** One label → value row for the read-only (display) view. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-44 shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">
        {value ? value : <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}

export function ProfileForm({
  defaultPrefix,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultTitle,
}: Props) {
  const router = useRouter();

  // Committed profile (what the display shows). Edit happens in a draft buffer.
  const [profile, setProfile] = React.useState({
    prefix: defaultPrefix,
    firstName: defaultFirstName,
    lastName: defaultLastName,
    email: defaultEmail,
    title: defaultTitle,
  });
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(profile);
  const [isPending, startTransition] = React.useTransition();

  // Password change — collapsed until the user opts in.
  const [pwOpen, setPwOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };
  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateMyProfile(draft);
        setProfile(draft);
        setEditing(false);
        toast.success("บันทึกโปรไฟล์เรียบร้อย");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  const closePassword = () => {
    setPwOpen(false);
    setCurrentPassword("");
    setNewPassword("");
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
        closePassword();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Profile ─────────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">ข้อมูลโปรไฟล์</h2>
              <p className="text-xs text-slate-500">ใช้สำหรับแสดงชื่อและล็อกอินเข้าระบบ</p>
            </div>
            {!editing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startEdit}
                className="shrink-0 gap-1.5 rounded-lg border-slate-200 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                แก้ไข
              </Button>
            )}
          </div>

          {!editing ? (
            <dl className="mt-4">
              <Field label="ชื่อ-นามสกุล" value={composeName(profile)} />
              <Field label="บทบาท" value={profile.title} />
              <Field label="อีเมลสำหรับล็อกอิน" value={profile.email} />
            </dl>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleProfileSubmit}>
              <PersonNameFields
                prefix={draft.prefix}
                firstName={draft.firstName}
                lastName={draft.lastName}
                onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
                disabled={isPending}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">บทบาท (label)</label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="rounded-xl border-slate-200 text-sm"
                  placeholder="เช่น Owner, Event Manager"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">อีเมลสำหรับล็อกอิน</label>
                <Input
                  required
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={cancelEdit}
                  className="rounded-xl px-4 py-2 text-sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {isPending ? "กำลังบันทึก…" : "บันทึก"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Password ────────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">รหัสผ่าน</h2>
              <p className="text-xs text-slate-500">อย่างน้อย 8 ตัวอักษร ห้ามซ้ำกับรหัสผ่านเดิม</p>
            </div>
            {!pwOpen && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPwOpen(true)}
                className="shrink-0 rounded-lg border-slate-200 text-xs"
              >
                เปลี่ยนรหัสผ่าน
              </Button>
            )}
          </div>

          {!pwOpen ? (
            <p className="mt-4 font-mono text-base tracking-[0.3em] text-slate-400">••••••••••</p>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handlePasswordSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">รหัสผ่านปัจจุบัน</label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-xl border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">รหัสผ่านใหม่</label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl border-slate-200 text-sm"
                    minLength={8}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={closePassword}
                  className="rounded-xl px-4 py-2 text-sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl px-4 py-2 text-sm font-medium"
                >
                  {isPending ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

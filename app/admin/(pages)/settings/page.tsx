import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/admins/profile-form";

export const metadata: Metadata = {
  title: "การตั้งค่า – การแข่งขันเดินทน",
  description: "ตั้งค่าโปรไฟล์ผู้ดูแลระบบและเปลี่ยนรหัสผ่าน",
};

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, title: true },
  });
  if (!user) redirect("/admin/login");

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">การตั้งค่า</h1>
          <p className="text-sm text-slate-600">
            ตั้งค่าโปรไฟล์ผู้ดูแลระบบ และเปลี่ยนรหัสผ่าน
          </p>
        </div>

        <ProfileForm
          defaultName={user.name ?? ""}
          defaultEmail={user.email ?? ""}
          defaultTitle={user.title ?? ""}
        />
      </div>
    </main>
  );
}

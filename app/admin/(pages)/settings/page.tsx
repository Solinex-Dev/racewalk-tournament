import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/admin-auth-redirect";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/admins/profile-form";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "การตั้งค่า – การแข่งขันเดินทน",
  description: "ตั้งค่าโปรไฟล์ผู้ดูแลระบบและเปลี่ยนรหัสผ่าน",
};

const settingsPath = "/admin/settings";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = session?.user?.id;

  if (!isAdminSession(role, userId)) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(settingsPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, prefix: true, firstName: true, lastName: true, email: true, title: true },
  });
  if (!user) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(settingsPath)}`);
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "ตั้งค่า" },
          ]}
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">การตั้งค่า</h1>
          <p className="text-sm text-slate-600">
            ตั้งค่าโปรไฟล์ผู้ดูแลระบบ และเปลี่ยนรหัสผ่าน
          </p>
        </div>

        <ProfileForm
          defaultPrefix={user.prefix ?? ""}
          defaultFirstName={user.firstName ?? user.name ?? ""}
          defaultLastName={user.lastName ?? ""}
          defaultEmail={user.email ?? ""}
          defaultTitle={user.title ?? ""}
        />
      </div>

      <footer className="mt-10 border-t border-slate-200 pt-5 text-center">
        <p className="text-xs text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Solinex</span>
        </p>
      </footer>
    </main>
  );
}

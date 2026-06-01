import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { AdminsList } from "@/components/admins/admins-list";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { prisma } from "@/lib/prisma";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { canAccessResource, hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "จัดการผู้ดูแลระบบ – การแข่งขันเดินทน",
  description:
    "หน้ารายการผู้ดูแลระบบทั้งหมดพร้อมลิงก์ดูรายละเอียดและสร้างผู้ดูแลระบบใหม่",
};

export default async function AdminsPage() {
  const me = await getCurrentAdmin();
  if (!me || !canAccessResource(me, "admins")) return <NoAccess />;

  // The admins list never shows the viewer themselves, nor any Root Admin.
  const rows = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      status: { not: "DELETED" },
      isRoot: false,
      id: { not: me.id },
    },
    orderBy: { name: "asc" },
  });

  const admins = rows.map((u) => ({
    id: u.id,
    name: u.name ?? "",
    role: u.title ?? "Admin",
    email: u.email ?? "",
    status: (u.status === "ACTIVE" ? "active" : "inactive") as "active" | "inactive",
  }));

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-6">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "ผู้ดูแลระบบ" },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              จัดการผู้ดูแลระบบ
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              รายการผู้ดูแลระบบทั้งหมดพร้อมลิงก์เข้าไปดู
              / แก้ไข และสร้างผู้ดูแลระบบใหม่
            </p>
          </div>

          {hasPermission(me, "admins", "create") && (
            <Link href="/admin/admins/new">
              <Button className="rounded-xl px-4 py-2 text-sm font-medium">
                + เพิ่ม Admin ใหม่
              </Button>
            </Link>
          )}
        </div>

        <AdminsList admins={admins} />
      </div>
    </main>
  );
}

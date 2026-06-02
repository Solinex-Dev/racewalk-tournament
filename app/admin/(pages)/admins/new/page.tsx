import Link from "next/link";
import type { Metadata } from "next";
import { AdminForm } from "@/components/admins/admin-form";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/common/page-breadcrumb";
import { NoAccess } from "@/components/admin/no-access";
import { getCurrentAdmin } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "สร้างผู้ดูแลระบบใหม่ – การแข่งขันเดินทน",
  description:
    "ฟอร์มสร้างผู้ดูแลระบบใหม่สำหรับจัดการ Event, Judges และ Athletes ใน Racewalk Tournament.",
};

export default async function NewAdminPage() {
  const me = await getCurrentAdmin();
  if (!hasPermission(me, "admins", "create")) return <NoAccess />;

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto flex max-w-full flex-col gap-4">
        <PageBreadcrumb
          items={[
            { label: "แดชบอร์ด", href: "/admin" },
            { label: "ผู้ดูแลระบบ", href: "/admin/admins" },
            { label: "เพิ่มผู้ดูแล" },
          ]}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              สร้าง Admin ใหม่
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              ฟอร์มสร้างผู้ดูแลระบบสำหรับจัดการ Event, Judges และ Athletes
            </p>
          </div>

          <Link href="/admin/admins">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 text-xs"
            >
              กลับไปหน้ารายการ
            </Button>
          </Link>
        </div>

        <AdminForm mode="create" currentUserIsRoot={me?.isRoot ?? false} />
      </div>
    </main>
  );
}



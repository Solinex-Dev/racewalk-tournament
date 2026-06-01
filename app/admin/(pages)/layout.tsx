import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/partials/admin-sidebar/app-sidebar";
import { getCurrentAdmin } from "@/lib/authz";
import { normalizePermissions } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "แดชบอร์ดผู้ดูแลระบบ – การแข่งขันเดินทน",
  description:
    "หน้าแดชบอร์ดผู้ดูแลสำหรับจัดการ Event, Judges, Athletes และการตั้งค่าระบบ",
};

export default async function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentAdmin();
  const permissions = normalizePermissions(me?.permissions);
  const isRoot = me?.isRoot ?? false;
  const displayName = me?.name?.trim() || me?.email || "ผู้ดูแลระบบ";
  const roleLabel = isRoot ? "Root Admin" : me?.title?.trim() || "ผู้ดูแลระบบ";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50">
        <DashboardSidebar
          permissions={permissions}
          isRoot={isRoot}
          displayName={displayName}
          roleLabel={roleLabel}
        />
        <SidebarInset className="flex flex-1 flex-col">
          {/* Top bar for mobile to open the sidebar sheet */}
          <header className="flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-3 shadow-sm md:hidden">
            <SidebarTrigger className="-ml-1" />
            <span className="text-sm font-semibold text-slate-900">
              Admin dashboard
            </span>
          </header>

          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


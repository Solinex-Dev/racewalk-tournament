import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/partials/admin-sidebar/app-sidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard – Racewalk Tournament",
  description:
    "หน้าแดชบอร์ดผู้ดูแลสำหรับจัดการ Event, Judges, Athletes และการตั้งค่าระบบ",
};

export default function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50">
        <DashboardSidebar />
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


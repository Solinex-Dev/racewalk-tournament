"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Home,
  CalendarDays,
  Users,
  UserCog,
  Medal,
  Settings,
  Building2,
  History,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/partials/admin-sidebar/logo";
import type { Route } from "./nav-main";
import DashboardNavigation from "@/components/partials/admin-sidebar/nav-main";
import {
  canAccessResource,
  emptyPermissions,
  hasPermission,
  RESOURCES,
  type PermissionMatrix,
  type Resource,
} from "@/lib/permissions";

// Flat nav — each item links straight to its page (no expandable children).
const dashboardRoutes: Route[] = [
  { id: "overview", title: "แดชบอร์ด", icon: <Home className="size-4" />, link: "/admin" },
  { id: "events", title: "กิจกรรม", icon: <CalendarDays className="size-4" />, link: "/admin/events" },
  { id: "admins", title: "ผู้ดูแล", icon: <UserCog className="size-4" />, link: "/admin/admins" },
  { id: "judges", title: "กรรมการ", icon: <Users className="size-4" />, link: "/admin/judges" },
  { id: "athletes", title: "นักกีฬา", icon: <Medal className="size-4" />, link: "/admin/athletes" },
  { id: "affiliations", title: "สังกัด", icon: <Building2 className="size-4" />, link: "/admin/affiliations" },
  { id: "activity", title: "ประวัติการใช้งาน", icon: <History className="size-4" />, link: "/admin/activity" },
  { id: "system", title: "System Monitor", icon: <ShieldAlert className="size-4" />, link: "/admin/system" },
  { id: "settings", title: "การตั้งค่า", icon: <Settings className="size-4" />, link: "/admin/settings" },
];

const RESOURCE_IDS = new Set<string>(RESOURCES);

export function DashboardSidebar({
  permissions,
  isRoot = false,
  displayName = "ผู้ดูแลระบบ",
  roleLabel = "ผู้ดูแลระบบ",
}: {
  permissions?: PermissionMatrix;
  isRoot?: boolean;
  displayName?: string;
  roleLabel?: string;
} = {}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isLoggingOut, startLogout] = useTransition();

  // Hide nav sections the admin cannot access.
  const user = { isRoot, permissions: permissions ?? emptyPermissions() };
  const routes = dashboardRoutes.filter((r) => {
    // The system monitor is Root-admin only.
    if (r.id === "system") return user.isRoot;
    // The audit log sits under the "admins" permission.
    if (r.id === "activity") return canAccessResource(user, "admins");
    if (!RESOURCE_IDS.has(r.id)) return true;
    // The events section is also visible to Moderator-only and Reports-only admins.
    if (r.id === "events") {
      return (
        canAccessResource(user, "events") ||
        hasPermission(user, "moderator", "view") ||
        hasPermission(user, "reports", "view")
      );
    }
    return canAccessResource(user, r.id as Resource);
  });

  const handleLogout = () => {
    startLogout(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ callbackUrl: "/admin/login" });
    });
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between"
        )}
      >
        <a href="#" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-semibold text-black dark:text-white">
              การแข่งขันเดินทน
            </span>
          )}
        </a>

        <motion.div
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={routes} />
      </SidebarContent>
      <SidebarFooter className="px-2 pb-3 pt-0">
        {isCollapsed ? (
          // Collapsed rail: a centered avatar + an icon-only logout button.
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-background"
              title={`${displayName} · ${roleLabel}`}
            >
              <Logo className="size-4" />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isLoggingOut}
              onClick={handleLogout}
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
              className="size-8 rounded-lg border-slate-300 p-0 text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-background px-3 py-2 text-left text-sm">
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-foreground">
                <Logo className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoggingOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออกจากระบบ</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

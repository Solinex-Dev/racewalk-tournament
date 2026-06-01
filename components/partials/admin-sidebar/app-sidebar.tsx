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
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/partials/admin-sidebar/logo";
import type { Route } from "./nav-main";
import DashboardNavigation from "@/components/partials/admin-sidebar/nav-main";
import { NotificationsPopover } from "@/components/partials/admin-sidebar/nav-notifications";
import {
  canAccessResource,
  emptyPermissions,
  hasPermission,
  RESOURCES,
  type PermissionMatrix,
  type Resource,
} from "@/lib/permissions";

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "ได้รับคำสั่งซื้อใหม่",
    time: "10 นาทีที่แล้ว",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "อัปเกรดเซิร์ฟเวอร์เสร็จสิ้น",
    time: "1 ชั่วโมงที่แล้ว",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "มีผู้ใช้ใหม่ลงทะเบียน",
    time: "2 ชั่วโมงที่แล้ว",
  },
];

const dashboardRoutes: Route[] = [
  {
    id: "overview",
    title: "แดชบอร์ด",
    icon: <Home className="size-4" />,
    link: "/admin",
  },
  {
    id: "events",
    title: "กิจกรรม",
    icon: <CalendarDays className="size-4" />,
    link: "/admin/events",
    subs: [
      {
        title: "กิจกรรมทั้งหมด",
        link: "/admin/events",
        icon: <CalendarDays className="size-4" />,
      },
      {
        title: "กิจกรรมใหม่",
        link: "/admin/events/new",
        icon: <CalendarDays className="size-4" />,
      },
    ],
  },
  {
    id: "admins",
    title: "ผู้ดูแล",
    icon: <UserCog className="size-4" />,
    link: "/admin/admins",
    subs: [
      {
        title: "ผู้ดูแลทั้งหมด",
        link: "/admin/admins",
        icon: <UserCog className="size-4" />,
      },
      {
        title: "ผู้ดูแลใหม่",
        link: "/admin/admins/new",
        icon: <UserCog className="size-4" />,
      },
    ],
  },
  {
    id: "judges",
    title: "กรรมการ",
    icon: <Users className="size-4" />,
    link: "/admin/judges",
    subs: [
      {
        title: "กรรมการทั้งหมด",
        link: "/admin/judges",
        icon: <Users className="size-4" />,
      },
      {
        title: "กรรมการใหม่",
        link: "/admin/judges/new",
        icon: <Users className="size-4" />,
      },
    ],
  },
  {
    id: "athletes",
    title: "นักกีฬา",
    icon: <Medal className="size-4" />,
    link: "/admin/athletes",
    subs: [
      {
        title: "นักกีฬาทั้งหมด",
        link: "/admin/athletes",
        icon: <Medal className="size-4" />,
      },
      {
        title: "นักกีฬาใหม่",
        link: "/admin/athletes/new",
        icon: <Medal className="size-4" />,
      },
    ],
  },
  {
    id: "affiliations",
    title: "สังกัด",
    icon: <Building2 className="size-4" />,
    link: "/admin/affiliations",
    subs: [
      {
        title: "สังกัดทั้งหมด",
        link: "/admin/affiliations",
        icon: <Building2 className="size-4" />,
      },
      {
        title: "สังกัดใหม่",
        link: "/admin/affiliations/new",
        icon: <Building2 className="size-4" />,
      },
    ],
  },
  {
    id: "settings",
    title: "การตั้งค่า",
    icon: <Settings className="size-4" />,
    link: "/admin/settings",
  },
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

  // Hide nav sections the admin cannot access; hide "new" sub-links without create.
  const user = { isRoot, permissions: permissions ?? emptyPermissions() };
  const routes = dashboardRoutes
    .filter((r) => {
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
    })
    .map((r) => {
      if (!RESOURCE_IDS.has(r.id) || !r.subs) return r;
      const res = r.id as Resource;
      return {
        ...r,
        subs: r.subs.filter((s) =>
          s.link.endsWith("/new") ? hasPermission(user, res, "create") : true,
        ),
      };
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
          <NotificationsPopover notifications={sampleNotifications} />
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={routes} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2 px-2 pb-3 pt-0">
        {/* Current team / user display (no dropdown) */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-background px-3 py-2 text-left text-sm">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-100 text-foreground">
            <Logo className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {roleLabel}
              </span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoggingOut}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>ออกจากระบบ</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

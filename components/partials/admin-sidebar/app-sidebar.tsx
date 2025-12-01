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
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/partials/admin-sidebar/logo";
import type { Route } from "./nav-main";
import DashboardNavigation from "@/components/partials/admin-sidebar/nav-main";
import { NotificationsPopover } from "@/components/partials/admin-sidebar/nav-notifications";

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "New order received.",
    time: "10m ago",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "Server upgrade completed.",
    time: "1h ago",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "New user signed up.",
    time: "2h ago",
  },
];

const dashboardRoutes: Route[] = [
  {
    id: "overview",
    title: "Dashboard",
    icon: <Home className="size-4" />,
    link: "/admin",
  },
  {
    id: "events",
    title: "Events",
    icon: <CalendarDays className="size-4" />,
    link: "/admin/events",
    subs: [
      {
        title: "All events",
        link: "/admin/events",
        icon: <CalendarDays className="size-4" />,
      },
      {
        title: "New event",
        link: "/admin/events/new",
        icon: <CalendarDays className="size-4" />,
      },
    ],
  },
  {
    id: "admins",
    title: "Admins",
    icon: <UserCog className="size-4" />,
    link: "/admin/admins",
    subs: [
      {
        title: "All admins",
        link: "/admin/admins",
        icon: <UserCog className="size-4" />,
      },
      {
        title: "New admin",
        link: "/admin/admins/new",
        icon: <UserCog className="size-4" />,
      },
    ],
  },
  {
    id: "judges",
    title: "Judges",
    icon: <Users className="size-4" />,
    link: "/admin/judges",
    subs: [
      {
        title: "All judges",
        link: "/admin/judges",
        icon: <Users className="size-4" />,
      },
      {
        title: "New judge",
        link: "/admin/judges/new",
        icon: <Users className="size-4" />,
      },
    ],
  },
  {
    id: "athletes",
    title: "Athletes",
    icon: <Medal className="size-4" />,
    link: "/admin/athletes",
    subs: [
      {
        title: "All athletes",
        link: "/admin/athletes",
        icon: <Medal className="size-4" />,
      },
      {
        title: "New athlete",
        link: "/admin/athletes/new",
        icon: <Medal className="size-4" />,
      },
    ],
  },
  {
    id: "affiliations",
    title: "Affiliations",
    icon: <Building2 className="size-4" />,
    link: "/admin/affiliations",
    subs: [
      {
        title: "All affiliations",
        link: "/admin/affiliations",
        icon: <Building2 className="size-4" />,
      },
      {
        title: "New affiliation",
        link: "/admin/affiliations/new",
        icon: <Building2 className="size-4" />,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: <Settings className="size-4" />,
    link: "/admin/settings",
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();

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
              Acme
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
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2 px-2 pb-3 pt-0">
        {/* Current team / user display (no dropdown) */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-background px-3 py-2 text-left text-sm">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-100 text-foreground">
            <Logo className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="truncate font-semibold">Alpha Inc.</span>
              <span className="truncate text-xs text-muted-foreground">
                Free
              </span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
          onClick={() => router.push("/admin/login")}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

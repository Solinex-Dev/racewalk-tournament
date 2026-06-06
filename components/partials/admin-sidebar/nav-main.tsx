"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

export type Route = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link: string;
};

export default function DashboardNavigation({ routes }: Readonly<{ routes: Route[] }>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();

  // "/admin" matches only itself (it's a prefix of every admin route); the rest
  // match their page and any sub-route (e.g. /admin/events/[id]).
  const isActive = (link: string) =>
    link === "/admin"
      ? pathname === "/admin"
      : pathname === link || pathname.startsWith(`${link}/`);

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const active = isActive(route.link);
        return (
          <SidebarMenuItem key={route.id}>
            <SidebarMenuButton tooltip={route.title} asChild>
              <Link
                href={route.link}
                prefetch={true}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-lg px-2 transition-colors",
                  active
                    ? "bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                    : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                  isCollapsed && "justify-center",
                )}
              >
                {route.icon}
                {!isCollapsed && <span className="ml-2 text-sm font-medium">{route.title}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

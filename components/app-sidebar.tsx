"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { NAVIGATION_ITEMS, UserRole } from "@/lib/navigation"; // นำเข้าจาก Config

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const skeletonWidths = ["72%", "58%", "84%", "66%", "76%", "62%", "80%", "68%"];

  const navMain = React.useMemo(() => {
    if (!user?.role) return [];
    return NAVIGATION_ITEMS.filter((item) =>
      item.allowedUserRoles.includes(user.role as UserRole),
    );
  }, [user]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/back-office">
                <span className="font-semibold text-base">PET HOUSE</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isPending ? (
          <div className="flex flex-col gap-1 px-2 py-2" aria-busy="true">
            {skeletonWidths.map((width, index) => (
              <SidebarMenuSkeleton key={index} showIcon width={width} />
            ))}
          </div>
        ) : (
          <NavMain items={navMain} />
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.name || "Unknown User",
              email: user.email || "",
              avatar: user.image || "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

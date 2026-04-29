"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { NAVIGATION_ITEMS, UserRole } from "@/lib/navigation"; // นำเข้าจาก Config

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

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
          <div className="flex justify-center items-center h-32">
            <Loader2 className="size-6 text-muted-foreground animate-spin" />
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

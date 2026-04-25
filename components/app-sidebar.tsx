"use client";

import * as React from "react";

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
import {
  UsersIcon,
  User2Icon,
  PawPrintIcon,
  LayoutGridIcon,
  CalendarClockIcon,
  ReceiptIcon,
  ListTodoIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "จัดการผู้ใช้",
      url: "/users",
      icon: <UsersIcon />,
    },
    {
      title: "จัดการลูกค้าและสัตว์เลี้ยง",
      url: "/customers",
      icon: <User2Icon />,
    },
    {
      title: "จัดการสายพันธุ์สัตว์เลี้ยง",
      url: "/pet-breeds",
      icon: <PawPrintIcon />,
    },
    {
      title: "จัดการบริการ",
      url: "/services",
      icon: <LayoutGridIcon />,
    },
    {
      title: "จัดการนัดหมาย",
      url: "/appointments",
      icon: <CalendarClockIcon />,
    },
    {
      title: "คิวงานประจำวัน",
      url: "/operations",
      icon: <ListTodoIcon />,
    },
    {
      title: "POS",
      url: "/pos",
      icon: <ReceiptIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="#">
                <span className="font-semibold text-base">PET HOUSE</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || "",
            email: user?.email || "",
            avatar: user?.image || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

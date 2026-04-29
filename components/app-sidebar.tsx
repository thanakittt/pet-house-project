"use client";

import * as React from "react";
import Link from "next/link";
import {
  UsersIcon,
  User2Icon,
  PawPrintIcon,
  LayoutGridIcon,
  CalendarClockIcon,
  ReceiptIcon,
  ListTodoIcon,
  PackageIcon,
  WalletIcon,
  BarChart3Icon,
  Loader2,
} from "lucide-react";

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

export type UserRole = "owner" | "admin" | "staff" | "customer" | "guest";

interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  allowedUserRoles: UserRole[];
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: "ภาพรวมธุรกิจ",
    url: "/back-office/dashboard",
    icon: <BarChart3Icon className="size-4" />,
    allowedUserRoles: ["owner"],
  },
  {
    title: "จัดการผู้ใช้",
    url: "/back-office/users",
    icon: <UsersIcon className="size-4" />,
    allowedUserRoles: ["admin"],
  },
  {
    title: "จัดการลูกค้าและสัตว์เลี้ยง",
    url: "/back-office/customers",
    icon: <User2Icon className="size-4" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการสายพันธุ์สัตว์เลี้ยง",
    url: "/back-office/pet-breeds",
    icon: <PawPrintIcon className="size-4" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการบริการ",
    url: "/back-office/services",
    icon: <LayoutGridIcon className="size-4" />,
    allowedUserRoles: ["owner", "admin"],
  },
  {
    title: "จัดการนัดหมาย",
    url: "/back-office/appointments",
    icon: <CalendarClockIcon className="size-4" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "คิวงานประจำวัน",
    url: "/back-office/operations",
    icon: <ListTodoIcon className="size-4" />,
    allowedUserRoles: ["owner", "staff"],
  },
  {
    title: "POS",
    url: "/back-office/pos",
    icon: <ReceiptIcon className="size-4" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการหมวดหมู่สินค้า",
    url: "/back-office/inventory-categories",
    icon: <PackageIcon className="size-4" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการสินค้าคงคลัง",
    url: "/back-office/inventories",
    icon: <PackageIcon className="size-4" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการหมวดหมู่ธุรกรรม",
    url: "/back-office/transaction-categories",
    icon: <WalletIcon className="size-4" />,
    allowedUserRoles: ["owner"],
  },
  {
    title: "จัดการบัญชี",
    url: "/back-office/accounting",
    icon: <WalletIcon className="size-4" />,
    allowedUserRoles: ["owner"],
  },
];

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
              <Link href="/back-office/dashboard">
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

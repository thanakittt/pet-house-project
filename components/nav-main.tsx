"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: Pick<NavItem, "title" | "url" | "icon" | "desktopOnly">[];
}) {
  const pathname = usePathname();
  const isActive = (url: string) => {
    if (url === "/back-office") {
      return pathname === url;
    }
    return pathname.startsWith(url + "/") || pathname === url;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.url}
              className={cn(item.desktopOnly && "hidden lg:block")}
            >
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                className={
                  isActive(item.url)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : undefined
                }
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

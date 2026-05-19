import * as React from "react";
import {
  House,
  LayoutDashboard,
  UserCog,
  Users,
  PawPrint,
  Scissors,
  CalendarClock,
  ClipboardList,
  Store,
  Layers,
  Tags,
  CircleDollarSign,
  Megaphone,
  MessageCircle,
  ReceiptText,
  Package,
} from "lucide-react";

export type UserRole = "owner" | "admin" | "staff" | "customer" | "guest";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  allowedUserRoles: UserRole[];
  desktopOnly?: boolean;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: "หน้าหลัก",
    url: "/back-office",
    icon: <House className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "ภาพรวมธุรกิจ",
    url: "/back-office/dashboard",
    icon: <LayoutDashboard className="size-5" />,
    allowedUserRoles: ["owner"],
    desktopOnly: true,
  },
  {
    title: "จัดการผู้ใช้",
    url: "/back-office/users",
    icon: <UserCog className="size-5" />,
    allowedUserRoles: ["admin"],
    desktopOnly: true,
  },
  {
    title: "จัดการลูกค้าและสัตว์เลี้ยง",
    url: "/back-office/customers",
    icon: <Users className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการสายพันธุ์",
    url: "/back-office/pet-breeds",
    icon: <PawPrint className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการบริการ",
    url: "/back-office/services",
    icon: <Scissors className="size-5" />,
    allowedUserRoles: ["owner", "admin"],
  },
  {
    title: "จัดการนัดหมาย",
    url: "/back-office/appointments",
    icon: <CalendarClock className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "คิวงานประจำวัน",
    url: "/back-office/operations",
    icon: <ClipboardList className="size-5" />,
    allowedUserRoles: ["staff"],
  },
  {
    title: "POS",
    url: "/back-office/pos",
    icon: <Store className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
    desktopOnly: true,
  },
  {
    title: "จัดการประกาศ",
    url: "/back-office/announcements",
    icon: <Megaphone className="size-5" />,
    allowedUserRoles: ["owner", "admin"],
  },
  {
    title: "จัดการ LINE OA",
    url: "/back-office/line-oa",
    icon: <MessageCircle className="size-5" />,
    allowedUserRoles: ["owner", "admin"],
    desktopOnly: true,
  },
  {
    title: "จัดการหมวดหมู่สินค้า",
    url: "/back-office/inventory-categories",
    icon: <Layers className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
    desktopOnly: true,
  },
  {
    title: "จัดการสินค้าคงคลัง",
    url: "/back-office/inventories",
    icon: <Package className="size-5" />,
    allowedUserRoles: ["owner", "admin", "staff"],
  },
  {
    title: "จัดการหมวดหมู่ธุรกรรม",
    url: "/back-office/transaction-categories",
    icon: <Tags className="size-5" />,
    allowedUserRoles: ["owner"],
    desktopOnly: true,
  },
  {
    title: "จัดการบัญชี",
    url: "/back-office/accounting",
    icon: <CircleDollarSign className="size-5" />,
    allowedUserRoles: ["owner"],
    desktopOnly: true,
  },
  {
    title: "ตรวจสลิปโอนเงิน",
    url: "/back-office/payment-slip-verifications",
    icon: <ReceiptText className="size-5" />,
    allowedUserRoles: ["owner"],
    desktopOnly: true,
  },
];

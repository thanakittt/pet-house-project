import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/session"; // ปรับ path ให้ตรงกับที่เก็บ function ของคุณ
import { NAVIGATION_ITEMS, UserRole } from "@/lib/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "หน้าหลักหลังร้าน",
  description: "ศูนย์รวมเมนูจัดการร้าน Pet House สำหรับทีมงาน",
};

type QuickAccessModuleStyle = {
  iconBackground: string;
  iconText: string;
  hoverIconBackground: string;
  hoverIconText: string;
  hoverBorder: string;
};

// ตั้งค่าสีของการ์ด quick access ไว้จุดเดียว เพื่อให้ปรับสีแต่ละเมนูภายหลังได้ง่าย
const QUICK_ACCESS_MODULE_STYLES: Record<string, QuickAccessModuleStyle> = {
  "/back-office/dashboard": {
    iconBackground: "bg-blue-50",
    iconText: "text-blue-600",
    hoverIconBackground: "group-hover:bg-blue-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-blue-300",
  },
  "/back-office/users": {
    iconBackground: "bg-violet-50",
    iconText: "text-violet-600",
    hoverIconBackground: "group-hover:bg-violet-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-violet-300",
  },
  "/back-office/customers": {
    iconBackground: "bg-emerald-50",
    iconText: "text-emerald-600",
    hoverIconBackground: "group-hover:bg-emerald-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-emerald-300",
  },
  "/back-office/pet-breeds": {
    iconBackground: "bg-lime-50",
    iconText: "text-lime-700",
    hoverIconBackground: "group-hover:bg-lime-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-lime-300",
  },
  "/back-office/services": {
    iconBackground: "bg-pink-50",
    iconText: "text-pink-600",
    hoverIconBackground: "group-hover:bg-pink-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-pink-300",
  },
  "/back-office/appointments": {
    iconBackground: "bg-amber-50",
    iconText: "text-amber-600",
    hoverIconBackground: "group-hover:bg-amber-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-amber-300",
  },
  "/back-office/operations": {
    iconBackground: "bg-cyan-50",
    iconText: "text-cyan-600",
    hoverIconBackground: "group-hover:bg-cyan-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-cyan-300",
  },
  "/back-office/pos": {
    iconBackground: "bg-orange-50",
    iconText: "text-orange-600",
    hoverIconBackground: "group-hover:bg-orange-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-orange-300",
  },
  "/back-office/announcements": {
    iconBackground: "bg-rose-50",
    iconText: "text-rose-600",
    hoverIconBackground: "group-hover:bg-rose-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-rose-300",
  },
  "/back-office/line-oa": {
    iconBackground: "bg-green-50",
    iconText: "text-green-600",
    hoverIconBackground: "group-hover:bg-green-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-green-300",
  },
  "/back-office/inventory-categories": {
    iconBackground: "bg-indigo-50",
    iconText: "text-indigo-600",
    hoverIconBackground: "group-hover:bg-indigo-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-indigo-300",
  },
  "/back-office/inventories": {
    iconBackground: "bg-sky-50",
    iconText: "text-sky-600",
    hoverIconBackground: "group-hover:bg-sky-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-sky-300",
  },
  "/back-office/transaction-categories": {
    iconBackground: "bg-purple-50",
    iconText: "text-purple-600",
    hoverIconBackground: "group-hover:bg-purple-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-purple-300",
  },
  "/back-office/accounting": {
    iconBackground: "bg-teal-50",
    iconText: "text-teal-600",
    hoverIconBackground: "group-hover:bg-teal-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-teal-300",
  },
  "/back-office/payment-slip-verifications": {
    iconBackground: "bg-fuchsia-50",
    iconText: "text-fuchsia-600",
    hoverIconBackground: "group-hover:bg-fuchsia-600",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-fuchsia-300",
  },
};

const DEFAULT_QUICK_ACCESS_MODULE_STYLE: QuickAccessModuleStyle = {
  iconBackground: "bg-primary/10",
  iconText: "text-primary",
  hoverIconBackground: "group-hover:bg-primary",
  hoverIconText: "group-hover:text-primary-foreground",
  hoverBorder: "group-hover:border-primary/50",
};

export default async function BackOfficeHomePage() {
  // ดึงข้อมูล Session บน Server ฝั่งเพื่อทำ RBAC
  const session = await requireStaff();
  const userRole = session?.user?.role as UserRole;
  const userName = session?.user?.name || "ผู้ใช้งาน";

  // กรองเมนูตาม Role ของผู้ใช้
  const quickAccessModules = NAVIGATION_ITEMS.filter(
    (item) =>
      item.allowedUserRoles.includes(userRole) && item.url !== "/back-office",
  );

  return (
    <>
      <SiteHeader title="หน้าหลัก" />

      <BackOfficeContainer>
        <div className="flex flex-col space-y-2 mb-5">
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight">
            ยินดีต้อนรับ, {userName}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            ระบบจัดการร้านอาบน้ำตัดขนสัตว์เลี้ยง กรุณาเลือกเมนูที่คุณต้องการเข้าถึงจากรายการด้านล่าง
          </p>
        </div>

        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickAccessModules.map((module) => {
            const moduleStyle =
              QUICK_ACCESS_MODULE_STYLES[module.url] ??
              DEFAULT_QUICK_ACCESS_MODULE_STYLE;

            return (
              <Link
                key={module.url}
                href={module.url}
                className={cn(
                  "group block",
                  module.desktopOnly && "hidden lg:block",
                )}
              >
                <Card
                  className={cn(
                    "hover:bg-muted/50 hover:shadow-sm h-full transition-all duration-200",
                    moduleStyle.hoverBorder,
                  )}
                >
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
                    <div
                      className={cn(
                        "flex justify-center items-center rounded-lg size-10 transition-colors",
                        moduleStyle.iconBackground,
                        moduleStyle.iconText,
                        moduleStyle.hoverIconBackground,
                        moduleStyle.hoverIconText,
                      )}
                    >
                      {module.icon}
                    </div>
                    <CardTitle className="font-medium text-base">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </BackOfficeContainer>
    </>
  );
}

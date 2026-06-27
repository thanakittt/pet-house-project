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
const DEFAULT_QUICK_ACCESS_MODULE_STYLE: QuickAccessModuleStyle = {
  iconBackground: "bg-primary/10",
  iconText: "text-primary",
  hoverIconBackground: "group-hover:bg-primary",
  hoverIconText: "group-hover:text-primary-foreground",
  hoverBorder: "group-hover:border-primary/50",
};

const QUICK_ACCESS_MODULE_STYLES: Record<string, QuickAccessModuleStyle> = {
  "/back-office/dashboard": {
    iconBackground: "bg-blue-50 dark:bg-blue-950/40",
    iconText: "text-blue-600 dark:text-blue-300",
    hoverIconBackground: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-blue-300 dark:group-hover:border-blue-700",
  },
  "/back-office/users": {
    iconBackground: "bg-violet-50 dark:bg-violet-950/40",
    iconText: "text-violet-600 dark:text-violet-300",
    hoverIconBackground: "group-hover:bg-violet-600 dark:group-hover:bg-violet-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-violet-300 dark:group-hover:border-violet-700",
  },
  "/back-office/customers": {
    iconBackground: "bg-emerald-50 dark:bg-emerald-950/40",
    iconText: "text-emerald-600 dark:text-emerald-300",
    hoverIconBackground: "group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-emerald-300 dark:group-hover:border-emerald-700",
  },
  "/back-office/pet-breeds": {
    iconBackground: "bg-lime-50 dark:bg-lime-950/40",
    iconText: "text-lime-700 dark:text-lime-300",
    hoverIconBackground: "group-hover:bg-lime-600 dark:group-hover:bg-lime-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-lime-300 dark:group-hover:border-lime-700",
  },
  "/back-office/services": {
    iconBackground: "bg-pink-50 dark:bg-pink-950/40",
    iconText: "text-pink-600 dark:text-pink-300",
    hoverIconBackground: "group-hover:bg-pink-600 dark:group-hover:bg-pink-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-pink-300 dark:group-hover:border-pink-700",
  },
  "/back-office/appointments": {
    iconBackground: "bg-amber-50 dark:bg-amber-950/40",
    iconText: "text-amber-600 dark:text-amber-300",
    hoverIconBackground: "group-hover:bg-amber-600 dark:group-hover:bg-amber-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-amber-300 dark:group-hover:border-amber-700",
  },
  "/back-office/operations": {
    iconBackground: "bg-cyan-50 dark:bg-cyan-950/40",
    iconText: "text-cyan-600 dark:text-cyan-300",
    hoverIconBackground: "group-hover:bg-cyan-600 dark:group-hover:bg-cyan-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-cyan-300 dark:group-hover:border-cyan-700",
  },
  "/back-office/pos": {
    iconBackground: "bg-orange-50 dark:bg-orange-950/40",
    iconText: "text-orange-600 dark:text-orange-300",
    hoverIconBackground: "group-hover:bg-orange-600 dark:group-hover:bg-orange-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-orange-300 dark:group-hover:border-orange-700",
  },
  "/back-office/announcements": {
    iconBackground: "bg-rose-50 dark:bg-rose-950/40",
    iconText: "text-rose-600 dark:text-rose-300",
    hoverIconBackground: "group-hover:bg-rose-600 dark:group-hover:bg-rose-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-rose-300 dark:group-hover:border-rose-700",
  },
  "/back-office/line-oa": {
    iconBackground: "bg-green-50 dark:bg-green-950/40",
    iconText: "text-green-600 dark:text-green-300",
    hoverIconBackground: "group-hover:bg-green-600 dark:group-hover:bg-green-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-green-300 dark:group-hover:border-green-700",
  },
  "/back-office/inventory-categories": {
    iconBackground: "bg-indigo-50 dark:bg-indigo-950/40",
    iconText: "text-indigo-600 dark:text-indigo-300",
    hoverIconBackground: "group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-indigo-300 dark:group-hover:border-indigo-700",
  },
  "/back-office/inventories": {
    iconBackground: "bg-sky-50 dark:bg-sky-950/40",
    iconText: "text-sky-600 dark:text-sky-300",
    hoverIconBackground: "group-hover:bg-sky-600 dark:group-hover:bg-sky-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-sky-300 dark:group-hover:border-sky-700",
  },
  "/back-office/transaction-categories": {
    iconBackground: "bg-purple-50 dark:bg-purple-950/40",
    iconText: "text-purple-600 dark:text-purple-300",
    hoverIconBackground: "group-hover:bg-purple-600 dark:group-hover:bg-purple-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-purple-300 dark:group-hover:border-purple-700",
  },
  "/back-office/accounting": {
    iconBackground: "bg-teal-50 dark:bg-teal-950/40",
    iconText: "text-teal-600 dark:text-teal-300",
    hoverIconBackground: "group-hover:bg-teal-600 dark:group-hover:bg-teal-500",
    hoverIconText: "group-hover:text-white",
    hoverBorder: "group-hover:border-teal-300 dark:group-hover:border-teal-700",
  },
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

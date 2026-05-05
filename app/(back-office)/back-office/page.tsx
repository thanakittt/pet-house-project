import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/session"; // ปรับ path ให้ตรงกับที่เก็บ function ของคุณ
import { NAVIGATION_ITEMS, UserRole } from "@/lib/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "หน้าหลักหลังร้าน",
  description: "ศูนย์รวมเมนูจัดการร้าน Pet House สำหรับทีมงาน",
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

      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex flex-col space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">
            ยินดีต้อนรับ, {userName}
          </h1>
          <p className="text-muted-foreground">
            ระบบจัดการร้านอาบน้ำตัดขนสัตว์เลี้ยง กรุณาเลือกเมนูที่คุณต้องการเข้าถึงจากรายการด้านล่าง
          </p>
        </div>

        <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickAccessModules.map((module) => (
            <Link key={module.url} href={module.url} className="group block">
              <Card className="hover:bg-muted/50 hover:shadow-sm hover:border-primary/50 h-full transition-all duration-200">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
                  <div className="flex justify-center items-center bg-primary/10 group-hover:bg-primary rounded-lg size-10 text-primary group-hover:text-primary-foreground transition-colors">
                    {module.icon}
                  </div>
                  <CardTitle className="font-medium text-base">
                    {module.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

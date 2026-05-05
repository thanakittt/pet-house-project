import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { StaffLoginForm } from "@/modules/auth/components/StaffLogin";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบพนักงาน",
  description: "เข้าสู่ระบบสำหรับพนักงานและผู้ดูแลร้าน Pet House",
};

export default async function StaffLoginPage() {
  const session = await getSession();
  if (session) {
    const role = session.user?.role;
    if (role && ["admin", "staff", "owner"].includes(role)) {
      redirect("/back-office");
    }
    redirect("/");
  }

  return <StaffLoginForm />;
}

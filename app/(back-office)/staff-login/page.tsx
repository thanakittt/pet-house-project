import { getSession, requireStaff } from "@/lib/session";
import { StaffLoginForm } from "@/modules/auth/components/StaffLogin";
import { redirect } from "next/navigation";

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

import { getSession } from "@/lib/session";
import { StaffLoginForm } from "@/modules/auth/components/StaffLogin";
import { redirect } from "next/navigation";

export default async function StaffLoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/back-office");
  }

  return <StaffLoginForm />;
}

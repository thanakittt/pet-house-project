import type { Metadata } from "next";
import { requireCustomer } from "@/lib/session";
import { SignInForm } from "@/modules/auth/components/SignInForm";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบบัญชีลูกค้า Pet House",
};

export default async function SignIn() {
  const session = await requireCustomer({ redirect: false });
  if (session) {
    redirect("/");
  }
  return <SignInForm />;
}

import type { Metadata } from "next";
import { requireCustomer } from "@/lib/session";
import { SignUpForm } from "@/modules/auth/components/SignUpForm";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: "สมัครบัญชีลูกค้า Pet House เพื่อใช้งานบริการออนไลน์",
};

export default async function SignUpPage() {
  const session = await requireCustomer({ redirect: false });
  if (session) {
    redirect("/");
  }
  return <SignUpForm />;
}

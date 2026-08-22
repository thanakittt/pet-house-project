import type { Metadata } from "next";
import { requireCustomer } from "@/lib/session";
import { SignUpForm } from "@/modules/auth/components/SignUpForm";
import { redirect } from "next/navigation";
import { getSafeReturnTo } from "@/lib/safe-return-to";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: "สมัครบัญชีลูกค้า Pet House เพื่อใช้งานบริการออนไลน์",
};

type SignUpPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { returnTo } = await searchParams;
  const safeReturnTo = getSafeReturnTo(returnTo);
  const session = await requireCustomer({ redirect: false });
  if (session) {
    redirect(safeReturnTo ?? "/");
  }
  return <SignUpForm returnTo={safeReturnTo} />;
}

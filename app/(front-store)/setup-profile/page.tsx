import type { Metadata } from "next";
import { requireCustomer } from "@/lib/session";
import { SetupProfileForm } from "@/modules/auth/components/setupProfileForm";
import { isCustomerExisted } from "@/modules/customer/queries/get-customer";
import { redirect } from "next/navigation";
import { getSafeReturnTo } from "@/lib/safe-return-to";

export const metadata: Metadata = {
  title: "ตั้งค่าโปรไฟล์",
  description: "กรอกข้อมูลลูกค้าเพื่อเริ่มใช้งานบัญชี Pet House",
};

type SetupProfileProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

export default async function SetupProfile({ searchParams }: SetupProfileProps) {
  const { returnTo } = await searchParams;
  const safeReturnTo = getSafeReturnTo(returnTo);
  const session = await requireCustomer();
  const user = session?.user;

  if (!user) {
    throw new Error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
  }

  const profileExisted = await isCustomerExisted(user.id);


  if (!profileExisted.success || !profileExisted.data) {
    throw new Error("เกิดข้อผิดพลาดในการตรวจสอบโปรไฟล์");
  }

  if (profileExisted.data.exists) {
    redirect(safeReturnTo ?? "/");
  }

  return (
    <SetupProfileForm
      userId={user.id}
      name={user.name}
      returnTo={safeReturnTo}
    />
  );
}

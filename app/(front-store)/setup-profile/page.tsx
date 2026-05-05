import type { Metadata } from "next";
import { requireCustomer } from "@/lib/session";
import { SetupProfileForm } from "@/modules/auth/components/setupProfileForm";
import { isCustomerExisted } from "@/modules/customer/queries/get-customer";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ตั้งค่าโปรไฟล์",
  description: "กรอกข้อมูลลูกค้าเพื่อเริ่มใช้งานบัญชี Pet House",
};

export default async function SetupProfile() {
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
    redirect("/");
  }

  return <SetupProfileForm userId={user.id} name={user.name} />;
}

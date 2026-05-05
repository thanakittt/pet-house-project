import type { Metadata } from "next";
import { requireCustomer } from "@/lib/session";
import ProfileForm from "@/modules/customer/components/ProfileForm";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "โปรไฟล์",
  description: "จัดการข้อมูลโปรไฟล์ลูกค้า Pet House",
};

export default async function ProfilePage() {
  const session = await requireCustomer();

  if (!session) {
    redirect("/sign-in");
  }

  const profile = await getCustomerProfile(session.user);

  if (!profile.success) {
    throw new Error(profile.error);
  }

  if (!profile.data) {
    redirect("/setup-profile");
  }

  return <ProfileForm profile={profile.data} />;
}

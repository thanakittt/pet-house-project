import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import BackOfficeProfileForm from "@/modules/staff/components/BackOfficeProfileForm";
import { getStaffProfile } from "@/modules/staff/queries/get-profile";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "โปรไฟล์ผู้ใช้งานหลังร้าน",
  description: "จัดการข้อมูลโปรไฟล์และความปลอดภัยของผู้ใช้งานหลังร้าน Pet House",
};

export default async function BackOfficeProfilePage() {
  const session = await requireStaff();

  if (!session) {
    redirect("/staff-login");
  }

  const profile = await getStaffProfile(session.user);

  if (!profile.success) {
    throw new Error(profile.error);
  }

  return (
    <>
      <SiteHeader title="บัญชีผู้ใช้" />
      <BackOfficeContainer>
        <BackOfficeProfileForm profile={profile.data} />
      </BackOfficeContainer>
    </>
  );
}

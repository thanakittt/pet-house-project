import type { Metadata } from "next";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { SiteHeader } from "@/components/site-header";
import { requireAdminAndOwner } from "@/lib/session";
import { getBusinessRules } from "@/modules/business-rules/business-rules";
import { BusinessRulesSettingsForm } from "@/modules/business-rules/components/BusinessRulesSettingsForm";

export const metadata: Metadata = {
  title: "ตั้งค่าร้าน",
  description: "จัดการเวลาทำการและนโยบายการจองของร้าน",
};

export default async function BusinessRulesSettingsPage() {
  await requireAdminAndOwner();
  const rules = await getBusinessRules();

  return (
    <>
      <SiteHeader title="ตั้งค่าร้าน" />
      <BackOfficeContainer className="max-w-5xl">
        <BusinessRulesSettingsForm initialRules={rules} />
      </BackOfficeContainer>
    </>
  );
}

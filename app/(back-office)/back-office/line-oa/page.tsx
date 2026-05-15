import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireAdminAndOwner } from "@/lib/session";
import { LineOAManagement } from "@/modules/line-oa/components/LineOAManagement";
import { listAppointmentStatusTemplates } from "@/modules/line-oa/queries/list-appointment-status-templates";
import { getStaffAppointmentStatusTemplate } from "@/modules/line-oa/queries/get-staff-appointment-status-template";

export const metadata: Metadata = {
  title: "จัดการ LINE OA",
  description: "ส่งข้อความ Broadcast และจัดการ template แจ้งเตือนของ LINE OA",
};

export default async function LineOAPage() {
  await requireAdminAndOwner();
  const [templates, staffTemplate] = await Promise.all([
    listAppointmentStatusTemplates(),
    getStaffAppointmentStatusTemplate(),
  ]);

  return (
    <>
      <SiteHeader title="จัดการ LINE OA" />
      <BackOfficeContainer>
        <LineOAManagement templates={templates} staffTemplate={staffTemplate} />
      </BackOfficeContainer>
    </>
  );
}

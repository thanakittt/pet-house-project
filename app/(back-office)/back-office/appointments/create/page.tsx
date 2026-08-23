import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import CreateAppointmentForm from "@/modules/appointment/components/CreateAppointmentForm";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";
import { requireStaff } from "@/lib/session";
import { getBusinessRules } from "@/modules/business-rules/business-rules";

export const metadata: Metadata = {
  title: "เพิ่มนัดหมายใหม่",
  description: "สร้างนัดหมายบริการใหม่สำหรับลูกค้าและสัตว์เลี้ยง",
};

export default async function CreateAppointmentPage() {
  await requireStaff();

  const [servicesWithVariants, bookingRules] = await Promise.all([
    listServicesWithVariants(),
    getBusinessRules(),
  ]);

  if (!servicesWithVariants.success) {
    throw new Error(
      servicesWithVariants.error || "เกิดข้อผิดพลาดในการโหลดข้อมูลบริการ",
    );
  }

  return (
    <div>
      <SiteHeader title="เพิ่มนัดหมายใหม่" />
      <BackOfficeContainer>
        <BackButton className="mb-4" />
        <CreateAppointmentForm
          services={servicesWithVariants.data}
          bookingRules={bookingRules}
        />
      </BackOfficeContainer>
    </div>
  );
}

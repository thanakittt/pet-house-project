import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import { SiteHeader } from "@/components/site-header";
import CreateAppointmentForm from "@/modules/appointment/components/CreateAppointmentForm";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = {
  title: "เพิ่มนัดหมายใหม่",
  description: "สร้างนัดหมายบริการใหม่สำหรับลูกค้าและสัตว์เลี้ยง",
};

export default async function CreateAppointmentPage() {
  await requireStaff();

  const servicesWithVariants = await listServicesWithVariants();

  if (!servicesWithVariants.success) {
    throw new Error(
      servicesWithVariants.error || "เกิดข้อผิดพลาดในการโหลดข้อมูลบริการ",
    );
  }

  return (
    <div>
      <SiteHeader title="เพิ่มนัดหมายใหม่" />
      <div className="p-6">
        <BackButton className="mb-4" />
        <CreateAppointmentForm services={servicesWithVariants.data} />
      </div>
    </div>
  );
}

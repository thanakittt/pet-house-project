import BackButton from "@/components/BackButton";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import CreateAppointmentForm from "@/modules/appointment/components/CreateAppointmentForm";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateAppointmentPage() {
  const servicesWithVariants = await listServicesWithVariants();

  if (!servicesWithVariants.success) {
    return (
      <div>
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูลบริการ</p>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader title="เพิ่มนัดหมายใหม่" />
      <div className="p-6">
        <BackButton />
        <CreateAppointmentForm services={servicesWithVariants.data} />
      </div>
    </div>
  );
}

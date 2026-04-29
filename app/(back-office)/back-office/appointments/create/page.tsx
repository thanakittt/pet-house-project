import BackButton from "@/components/BackButton";
import { SiteHeader } from "@/components/site-header";
import CreateAppointmentForm from "@/modules/appointment/components/CreateAppointmentForm";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";
import { requireStaff } from "@/lib/session";

export default async function CreateAppointmentPage() {
  const session = await requireStaff();

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

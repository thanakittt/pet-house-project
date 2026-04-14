import { requireAdminAndOwner } from "@/lib/session";
import ServiceManagement from "@/modules/service/components/ServiceManagement";
import { listServices } from "@/modules/service/queries/list-services";
import { SiteHeader } from "@/components/site-header";

export default async function ServicesPage() {
  await requireAdminAndOwner();

  const services = await listServices();

  if (!services.success) {
    throw new Error(services.error);
  }

  return (
    <>
      <SiteHeader title="จัดการบริการ" />
      <div className="p-6">
        <ServiceManagement services={services.data} />
      </div>
    </>
  );
}

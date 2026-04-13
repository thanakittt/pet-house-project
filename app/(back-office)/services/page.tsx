import { requireAdminAndOwner } from "@/lib/session";
import ServiceManagement from "@/modules/service/components/ServiceManagement";
import { listServices } from "@/modules/service/queries/list-services";

export default async function ServicesPage() {
  await requireAdminAndOwner();

  const services = await listServices();

  if (!services.success) {
    throw new Error(services.error);
  }

  return <ServiceManagement services={services.data} />;
}

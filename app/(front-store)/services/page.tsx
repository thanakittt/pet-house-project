import { ServiceClient } from "@/modules/service/components/front-store/ServiceClient";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await listServicesWithVariants();

  if (!services.success) {
    throw new Error(services.error);
  }

  return <ServiceClient services={services.data} />;
}

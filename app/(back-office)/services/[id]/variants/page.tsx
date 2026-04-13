import { notFound } from "next/navigation";
import { requireAdminAndOwner } from "@/lib/session";
import ServiceVariantsManagement from "@/modules/service/components/ServiceVariantManagement";
import { getServiceVariants } from "@/modules/service/queries/get-service";
import { ServiceVariant } from "@/modules/service/types/service-variant";

interface ServiceVariantsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ServiceVariantsPage({
  params,
}: ServiceVariantsPageProps) {
  await requireAdminAndOwner();

  const { id } = await params;

  if (!id) {
    return notFound();
  }

  const serviceVariants = await getServiceVariants({ serviceId: id });

  if (!serviceVariants.success) {
    throw new Error(serviceVariants.error);
  }

  return (
    <ServiceVariantsManagement serviceId={id} variants={serviceVariants.data} />
  );
}

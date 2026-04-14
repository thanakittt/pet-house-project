import { notFound } from "next/navigation";
import { requireAdminAndOwner } from "@/lib/session";
import ServiceVariantsManagement from "@/modules/service/components/ServiceVariantManagement";
import { getServiceVariants } from "@/modules/service/queries/get-service";
import { SiteHeader } from "@/components/site-header";

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
    <>
      <SiteHeader title="จัดการตัวเลือกบริการ" />
      <div className="p-6">
        <ServiceVariantsManagement serviceId={id} variants={serviceVariants.data} />
      </div>
    </>
  );
}

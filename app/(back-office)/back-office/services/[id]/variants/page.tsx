import { SiteHeader } from "@/components/site-header";
import { requireAdminAndOwner } from "@/lib/session";
import ServiceVariantsManagement from "@/modules/service/components/ServiceVariantManagement";
import {
  getServiceVariants,
  parseServiceVariantPage,
  parseServiceVariantPetTypeFilter,
  parseServiceVariantSizeFilter,
} from "@/modules/service/queries/get-service";

interface ServiceVariantsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
    page?: string;
    petType?: string;
    size?: string;
  }>;
}

function getServiceVariantsBackHref(from: string | undefined) {
  if (
    from?.startsWith("/back-office/services") &&
    !from.includes("/variants")
  ) {
    return from;
  }

  return "/back-office/services";
}

export default async function ServiceVariantsPage({
  params,
  searchParams,
}: ServiceVariantsPageProps) {
  await requireAdminAndOwner();

  const [{ id }, query] = await Promise.all([params, searchParams]);

  const serviceVariants = await getServiceVariants({
    serviceId: id,
    page: parseServiceVariantPage(query.page),
    petType: parseServiceVariantPetTypeFilter(query.petType),
    size: parseServiceVariantSizeFilter(query.size),
  });

  if (!serviceVariants.success) {
    throw new Error(serviceVariants.error);
  }

  const backHref = getServiceVariantsBackHref(query.from);

  return (
    <>
      <SiteHeader title="จัดการตัวเลือกบริการ" />
      <div className="p-6">
        <ServiceVariantsManagement
          backHref={backHref}
          serviceId={id}
          {...serviceVariants.data}
        />
      </div>
    </>
  );
}

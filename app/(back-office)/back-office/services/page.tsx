import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { requireAdminAndOwner } from "@/lib/session";
import ServiceManagement from "@/modules/service/components/ServiceManagement";
import {
  listServices,
  parseServicePage,
  parseServiceTypeFilter,
} from "@/modules/service/queries/list-services";

export const metadata: Metadata = {
  title: "จัดการบริการ",
  description: "เพิ่ม แก้ไข และจัดการบริการของร้าน Pet House",
};

type ServicesPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
  }>;
};

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  await requireAdminAndOwner();

  const query = await searchParams;
  const services = await listServices({
    page: parseServicePage(query.page),
    q: query.q,
    type: parseServiceTypeFilter(query.type),
  });

  if (!services.success) {
    throw new Error(services.error);
  }

  return (
    <>
      <SiteHeader title="จัดการบริการ" />
      <div className="p-6">
        <ServiceManagement {...services.data} />
      </div>
    </>
  );
}

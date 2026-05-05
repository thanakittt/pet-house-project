import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";
import CustomerManagement from "@/modules/customer/components/CustomerManagement";
import {
  listCustomers,
  parseCustomerChannelFilter,
  parseCustomerPage,
} from "@/modules/customer/queries/list-customer";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "จัดการลูกค้า",
  description: "ค้นหาและจัดการข้อมูลลูกค้าและสัตว์เลี้ยง",
};

type CustomerManagementPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    channel?: string;
  }>;
};

export default async function CustomerManagementPage({
  searchParams,
}: CustomerManagementPageProps) {
  await requireStaff();

  const query = await searchParams;
  const customers = await listCustomers({
    page: parseCustomerPage(query.page),
    q: query.q,
    channel: parseCustomerChannelFilter(query.channel),
  });

  if (!customers.success) {
    throw new Error(customers.error);
  }

  if (customers.data === undefined) {
    return notFound();
  }

  return (
    <>
      <SiteHeader title="จัดการลูกค้า" />
      <div className="p-6">
        <CustomerManagement {...customers.data} />
      </div>
    </>
  );
}

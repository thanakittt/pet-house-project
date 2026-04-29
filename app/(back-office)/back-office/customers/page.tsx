import CustomerManagement from "@/modules/customer/components/CustomerManagement";
import { requireStaff } from "@/lib/session";
import { listCustomers } from "@/modules/customer/queries/list-customer";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export default async function CustomerManagementPage() {
  await requireStaff();

  const customers = await listCustomers();

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
        <CustomerManagement customers={customers.data} />
      </div>
    </>
  );
}

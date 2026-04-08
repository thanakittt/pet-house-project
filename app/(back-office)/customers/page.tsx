import CustomerManagement from "@/modules/customer/components/CustomerManagement";
import { requireStaff } from "@/lib/session";
import { listCustomers } from "@/modules/customer/queries/list-customer";
import { notFound } from "next/navigation";

export default async function CustomerManagementPage() {
  await requireStaff();

  const customers = await listCustomers();

  if (!customers.success) {
    throw new Error(customers.error);
  }

  if (customers.data === undefined) {
    notFound();
  }

  return <CustomerManagement customers={customers.data} />;
}

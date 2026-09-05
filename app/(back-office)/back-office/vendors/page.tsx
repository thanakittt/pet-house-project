import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import { VendorManagement } from "@/modules/vendors/components/VendorManagement";
import {
  listVendors,
  parseVendorPage,
} from "@/modules/vendors/queries/list-vendors";

export const metadata: Metadata = {
  title: "จัดการผู้จำหน่าย",
  description: "เพิ่ม แก้ไข และจัดการรายชื่อคู่ค้า/ผู้จำหน่ายสินค้า",
};

type VendorsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: "all" | "active" | "inactive";
  }>;
};

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  await requireStaff();

  const query = await searchParams;
  const vendorsResult = await listVendors({
    page: parseVendorPage(query.page),
    q: query.q,
    status: query.status,
  });

  if (!vendorsResult.success) {
    throw new Error(vendorsResult.error);
  }

  return (
    <>
      <SiteHeader title="จัดการผู้จำหน่าย" />
      <BackOfficeContainer>
        <VendorManagement {...vendorsResult.data} />
      </BackOfficeContainer>
    </>
  );
}

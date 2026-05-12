import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import { InventoryCategoryManagement } from "@/modules/inventory-category/components/InventoryCategoryManagement";
import {
  listInventoryCategories,
  parseInventoryCategoryPage,
} from "@/modules/inventory-category/queries/list-inventory-categories";

export const metadata: Metadata = {
  title: "จัดการหมวดหมู่สินค้า",
  description: "เพิ่ม แก้ไข และจัดหมวดหมู่สินค้าคงคลัง",
};

type InventoryCategoriesPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function InventoryCategoriesPage({
  searchParams,
}: InventoryCategoriesPageProps) {
  await requireStaff();

  const query = await searchParams;
  const inventoryCategories = await listInventoryCategories({
    page: parseInventoryCategoryPage(query.page),
    q: query.q,
  });

  if (!inventoryCategories.success) {
    throw new Error(inventoryCategories.error);
  }

  return (
    <>
      <SiteHeader title="จัดการหมวดหมู่สินค้า" />
      <BackOfficeContainer>
        <InventoryCategoryManagement {...inventoryCategories.data} />
      </BackOfficeContainer>
    </>
  );
}

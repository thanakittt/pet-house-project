import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";
import { InventoryCategoryManagement } from "@/modules/inventory-category/components/InventoryCategoryManagement";
import { listInventoryCategories } from "@/modules/inventory-category/queries/list-inventory-categories";

export default async function InventoryCategoriesPage() {
  await requireStaff();

  const inventoryCategories = await listInventoryCategories();

  if (!inventoryCategories.success) {
    throw new Error(inventoryCategories.error);
  }

  return (
    <>
      <SiteHeader title="จัดการหมวดหมู่สินค้า" />
      <div className="p-6">
        <InventoryCategoryManagement
          inventoryCategories={inventoryCategories.data}
        />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import PurchaseOrderFormPage from "@/modules/inventories/components/PurchaseOrderFormPage";
import { listAllInventories } from "@/modules/inventories/queries/list-inventories";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "สร้างใบสั่งซื้อใหม่",
  description: "สร้างใบสั่งซื้อสินค้าคงคลังสำหรับร้าน",
};

/**
 * CreatePurchaseOrderPage — Server Component
 * ดึงรายการสินค้าจาก DB แล้วส่งเป็น props ให้ PurchaseOrderFormPage
 */
export default async function CreatePurchaseOrderPage() {
  await requireStaff();

  const inventoriesResult = await listAllInventories();

  if (!inventoriesResult.success) {
    throw new Error(inventoriesResult.error);
  }

  const inventoryItems = inventoriesResult.data;

  return (
    <>
      <SiteHeader title="สร้างใบสั่งซื้อใหม่" />
      <BackOfficeContainer>
        <BackButton href="/back-office/inventories?tab=order" />
        <PurchaseOrderFormPage inventoryItems={inventoryItems} />
      </BackOfficeContainer>
    </>
  );
}

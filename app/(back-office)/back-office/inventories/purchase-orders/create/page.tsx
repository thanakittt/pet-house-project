import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import PurchaseOrderFormPage from "@/modules/inventories/components/PurchaseOrderFormPage";
import { listAllInventories } from "@/modules/inventories/queries/list-inventories";
import { listAllActiveVendors } from "@/modules/vendors/queries/list-vendors";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "สร้างใบสั่งซื้อใหม่",
  description: "สร้างใบสั่งซื้อสินค้าคงคลังสำหรับร้าน",
};

/**
 * CreatePurchaseOrderPage — Server Component
 * ดึงรายการสินค้าและผู้จำหน่ายที่เปิดใช้งานอยู่จาก DB แล้วส่งเป็น props ให้ PurchaseOrderFormPage
 */
export default async function CreatePurchaseOrderPage() {
  await requireStaff();

  const [inventoriesResult, vendorsResult] = await Promise.all([
    listAllInventories(),
    listAllActiveVendors(),
  ]);

  if (!inventoriesResult.success) {
    throw new Error(inventoriesResult.error);
  }

  if (!vendorsResult.success) {
    throw new Error(vendorsResult.error);
  }

  const inventoryItems = inventoriesResult.data;
  const vendors = vendorsResult.data;

  return (
    <>
      <SiteHeader title="สร้างใบสั่งซื้อใหม่" />
      <BackOfficeContainer>
        <BackButton href="/back-office/inventories?tab=order" />
        <PurchaseOrderFormPage
          inventoryItems={inventoryItems}
          vendors={vendors}
        />
      </BackOfficeContainer>
    </>
  );
}

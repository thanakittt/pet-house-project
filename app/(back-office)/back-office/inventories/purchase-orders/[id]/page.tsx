import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getPurchaseOrder } from "@/modules/inventories/queries/get-purchase-order";
import { listAllInventories } from "@/modules/inventories/queries/list-inventories";
import PurchaseOrderDetailPage from "@/modules/inventories/components/PurchaseOrderDetailPage";
import { InventoryItem } from "@/modules/inventories/types/inventory";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "รายละเอียดใบสั่งซื้อ",
  description: "ดูรายละเอียดและสถานะใบสั่งซื้อสินค้าคงคลัง",
};

/**
 * PurchaseOrderPage — Server Component
 * ดึงข้อมูลใบสั่งซื้อจาก DB แล้วส่งให้ Client Component แสดงผล
 * เมื่อ status = DRAFT จะดึง inventoryItems มาส่งด้วย เพื่อใช้ในฟีเจอร์แก้ไขรายการ
 */
export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();

  const { id } = await params;

  const result = await getPurchaseOrder(id);

  // ถ้าไม่พบ PO หรือเกิด error → แสดงหน้า 404
  if (!result.success || !result.data) {
    notFound();
  }

  const order = result.data;
  // ดึง inventoryItems ตอนที่ status = DRAFT หรือ ORDERED เพื่อใช้ในฟีเจอร์แก้ไขรายการ
  // และลดการ query DB ที่ไม่จำเป็นเมื่อ PO ปิดแล้ว (RECEIVED หรือ CANCELLED)
  let inventoryItems: InventoryItem[] = [];

  if (order.status === "DRAFT" || order.status === "ORDERED") {
    const inventoriesResult = await listAllInventories();
    if (inventoriesResult.success) {
      inventoryItems = inventoriesResult.data;
    }
  }

  return (
    <>
      <SiteHeader title="รายละเอียดใบสั่งซื้อ" />
      <BackOfficeContainer>
        <BackButton href="/back-office/inventories?tab=order" />

        <PurchaseOrderDetailPage
          order={order}
          inventoryItems={inventoryItems}
        />
      </BackOfficeContainer>
    </>
  );
}

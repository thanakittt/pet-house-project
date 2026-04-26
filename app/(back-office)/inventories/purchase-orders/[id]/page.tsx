import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getPurchaseOrder } from "@/modules/inventories/queries/get-purchase-order";
import { listInventories } from "@/modules/inventories/queries/list-inventories";
import PurchaseOrderDetailPage from "@/modules/inventories/components/PurchaseOrderDetailPage";
import { InventoryItem } from "@/modules/inventories/types/inventory";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
  if (!result.success) {
    notFound();
  }

  const order = result.data;

  // ดึง inventoryItems เฉพาะตอนที่ status = DRAFT
  // เพื่อลดการ query DB ที่ไม่จำเป็นเมื่อ PO ปิดแล้ว
  let inventoryItems: InventoryItem[] = [];

  if (order.status === "DRAFT") {
    const inventoriesResult = await listInventories();
    if (inventoriesResult.success) {
      inventoryItems = inventoriesResult.data;
    }
  }

  return (
    <>
      <SiteHeader title="รายละเอียดใบสั่งซื้อ" />
      <div className="p-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/inventories?tab=order">
            <ChevronLeft className="mr-2 w-4 h-4" />
            กลับ
          </Link>
        </Button>

        <PurchaseOrderDetailPage
          order={order}
          inventoryItems={inventoryItems}
        />
      </div>
    </>
  );
}

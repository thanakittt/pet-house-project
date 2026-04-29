import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import PurchaseOrderFormPage from "@/modules/inventories/components/PurchaseOrderFormPage";
import { listInventories } from "@/modules/inventories/queries/list-inventories";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * CreatePurchaseOrderPage — Server Component
 * ดึงรายการสินค้าจาก DB แล้วส่งเป็น props ให้ PurchaseOrderFormPage
 */
export default async function CreatePurchaseOrderPage() {
  await requireStaff();

  const inventoriesResult = await listInventories();

  if (!inventoriesResult.success) {
    throw new Error(inventoriesResult.error);
  }

  const inventoryItems = inventoriesResult.data;

  return (
    <>
      <SiteHeader title="สร้างใบสั่งซื้อใหม่" />
      <div className="p-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/back-office/inventories?tab=order">
            <ChevronLeft className="mr-2 w-4 h-4" />
            กลับ
          </Link>
        </Button>
        <PurchaseOrderFormPage inventoryItems={inventoryItems} />
      </div>
    </>
  );
}

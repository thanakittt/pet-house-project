import { requireStaff } from "@/lib/session";
import PurchaseOrdersPage from "@/modules/inventories/components/PurchaseOrdersPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoriesClient } from "@/modules/inventories/components/InventoriesClient";
import { listInventories } from "@/modules/inventories/queries/list-inventories";
import { listAllInventoryCategories } from "@/modules/inventory-category/queries/list-inventory-categories";
import { listPurchaseOrders } from "@/modules/inventories/queries/list-purchase-orders";
import { SiteHeader } from "@/components/site-header";

interface InventoriesPageProps {
  searchParams: Promise<{ tab?: "inventory" | "order" }>;
}

export default async function InventoriesPage({
  searchParams,
}: InventoriesPageProps) {
  await requireStaff();

  const { tab } = await searchParams;

  const defaultTab = tab || "inventory";

  // ดึงข้อมูลทั้ง 3 ชุดพร้อมกัน เพื่อหลีกเลี่ยง data waterfall
  const [inventoriesResult, categoriesResult, purchaseOrdersResult] =
    await Promise.all([
      listInventories(),
      listAllInventoryCategories(),
      listPurchaseOrders(),
    ]);

  const inventories = inventoriesResult.success ? inventoriesResult.data : [];
  const inventoryCategories = categoriesResult.success
    ? categoriesResult.data
    : [];
  const purchaseOrders = purchaseOrdersResult.success
    ? purchaseOrdersResult.data
    : [];

  return (
    <>
      <SiteHeader title="จัดการสินค้าคงคลัง" />

      <div className="p-6">
        <Tabs
          defaultValue={defaultTab}
          className="mx-auto mt-5 w-full md:w-5xl"
        >
          <TabsList className="py-5 w-full md:w-1/2">
            <TabsTrigger value="inventory">สินค้าคงคลัง</TabsTrigger>
            <TabsTrigger value="order">รับ &amp; สั่งสินค้า</TabsTrigger>
          </TabsList>

          {/* ── Tab: สินค้าคงคลัง ── */}
          <TabsContent value="inventory">
            <InventoriesClient
              inventories={inventories}
              inventoryCategories={inventoryCategories}
            />
          </TabsContent>

          {/* ── Tab: ใบสั่งซื้อ ── */}
          <TabsContent value="order">
            <PurchaseOrdersPage orders={purchaseOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

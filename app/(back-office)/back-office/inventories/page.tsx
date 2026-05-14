import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import PurchaseOrdersPage from "@/modules/inventories/components/PurchaseOrdersPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoriesClient } from "@/modules/inventories/components/InventoriesClient";
import {
  listInventories,
  parseInventoryPage,
  parseInventoryStatusFilter,
} from "@/modules/inventories/queries/list-inventories";
import { listAllInventoryCategories } from "@/modules/inventory-category/queries/list-inventory-categories";
import {
  listPurchaseOrders,
  parsePurchaseOrderPage,
  parsePurchaseOrderStatusFilter,
} from "@/modules/inventories/queries/list-purchase-orders";
import Link from "next/link";

export const metadata: Metadata = {
  title: "จัดการสินค้าคงคลัง",
  description: "ติดตามสินค้า คลังคงเหลือ และใบสั่งซื้อของร้าน",
};

type InventoryTab = "inventory" | "order";

interface InventoriesPageProps {
  searchParams: Promise<{
    invCategoryId?: string;
    invPage?: string;
    invQ?: string;
    invStatus?: string;
    orderPage?: string;
    orderQ?: string;
    orderStatus?: string;
    tab?: string;
  }>;
}

function parseInventoryTab(value: unknown): InventoryTab {
  return value === "order" ? "order" : "inventory";
}

function buildTabHref(
  query: Awaited<InventoriesPageProps["searchParams"]>,
  tab: InventoryTab,
) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  });

  if (tab === "inventory") {
    params.delete("tab");
  } else {
    params.set("tab", "order");
  }

  const queryString = params.toString();
  return queryString
    ? `/back-office/inventories?${queryString}`
    : "/back-office/inventories";
}

export default async function InventoriesPage({
  searchParams,
}: InventoriesPageProps) {
  await requireStaff();

  const query = await searchParams;
  const defaultTab = parseInventoryTab(query.tab);

  const [inventoriesResult, categoriesResult, purchaseOrdersResult] =
    await Promise.all([
      listInventories({
        categoryId: query.invCategoryId,
        page: parseInventoryPage(query.invPage),
        q: query.invQ,
        status: parseInventoryStatusFilter(query.invStatus),
      }),
      listAllInventoryCategories(),
      listPurchaseOrders({
        page: parsePurchaseOrderPage(query.orderPage),
        q: query.orderQ,
        status: parsePurchaseOrderStatusFilter(query.orderStatus),
      }),
    ]);

  if (!inventoriesResult.success) {
    throw new Error(inventoriesResult.error);
  }

  if (!categoriesResult.success) {
    throw new Error(categoriesResult.error);
  }

  if (!purchaseOrdersResult.success) {
    throw new Error(purchaseOrdersResult.error);
  }

  return (
    <>
      <SiteHeader title="จัดการสินค้าคงคลัง" />

      <BackOfficeContainer>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList width="half" size="lg" className="mb-4">
            <TabsTrigger value="inventory" asChild>
              <Link href={buildTabHref(query, "inventory")}>สินค้าคงคลัง</Link>
            </TabsTrigger>
            <TabsTrigger value="order" asChild>
              <Link href={buildTabHref(query, "order")}>
                รับ &amp; สั่งสินค้า
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoriesClient
              inventoryData={inventoriesResult.data}
              inventoryCategories={categoriesResult.data}
            />
          </TabsContent>

          <TabsContent value="order">
            <PurchaseOrdersPage orderData={purchaseOrdersResult.data} />
          </TabsContent>
        </Tabs>
      </BackOfficeContainer>
    </>
  );
}

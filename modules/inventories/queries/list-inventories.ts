import { db } from "@/db";
import { ActionResponse } from "@/types/action";
import { InventoryItem } from "../types/inventory";
import { inventoryCategories, inventoryItems } from "@/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import { requireStaff } from "@/lib/session";

export async function listInventories(): Promise<
  ActionResponse<InventoryItem[]>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลสินค้าคงคลัง",
      };
    }

    const data = await db.query.inventoryItems.findMany({
      where: isNull(inventoryItems.deletedAt),
      orderBy: desc(inventoryItems.createdAt),
      with: {
        category: true,
      },
    });

    const formattedData: InventoryItem[] = data.map(
      ({ category, ...item }) => ({
        ...item,
        inventoryCategoryName: category?.name || "ไม่มีหมวดหมู่",
      }),
    );

    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("listInventories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าคงคลัง",
    };
  }
}

import { db } from "@/db";
import { ActionResponse } from "@/types/action";
import { InventoryCategory } from "../types/inventory-category";
import { inventoryCategories } from "@/db/schema";
import { desc, isNull } from "drizzle-orm";
import { requireStaff } from "@/lib/session";

export async function listInventoryCategories(): Promise<
  ActionResponse<InventoryCategory[]>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลหมวดหมู่สินค้า",
      };
    }

    const data = await db
      .select({
        id: inventoryCategories.id,
        name: inventoryCategories.name,
      })
      .from(inventoryCategories)
      .where(isNull(inventoryCategories.deletedAt))
      .orderBy(desc(inventoryCategories.createdAt));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("listInventoryCategories error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่สินค้า",
    };
  }
}

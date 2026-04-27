"use server";

import { db } from "@/db";
import { inventoryCategories, inventoryItems } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

export async function deleteInventoryCategory({
  id,
}: {
  id: string;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการลบหมวดหมู่สินค้า",
      };
    }

    const [activeItem] = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.inventoryCategoryId, id),
          isNull(inventoryItems.deletedAt),
        ),
      )
      .limit(1);

    if (activeItem) {
      return {
        success: false,
        error: "ไม่สามารถลบหมวดหมู่ที่ยังมีสินค้าคงคลังใช้งานอยู่",
      };
    }

    const result = await db
      .update(inventoryCategories)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(inventoryCategories.id, id),
          isNull(inventoryCategories.deletedAt),
        ),
      )
      .returning({ id: inventoryCategories.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบหมวดหมู่สินค้าที่ต้องการลบ",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteInventoryCategory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบหมวดหมู่สินค้า",
    };
  }
}

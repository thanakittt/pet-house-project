"use server";

import { db } from "@/db";
import { InventoryCategoryForm } from "../types/inventory-category";
import { inventoryCategories } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { requireStaff } from "@/lib/session";

export async function updateInventoryCategory({
  id,
  data,
}: {
  id: string;
  data: InventoryCategoryForm;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขข้อมูลหมวดหมู่สินค้า",
      };
    }

    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return {
        success: false,
        error: "กรุณาระบุชื่อหมวดหมู่สินค้า",
      };
    }

    const result = await db
      .update(inventoryCategories)
      .set({
        name: trimmedName,
      })
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
        error: "ไม่พบหมวดหมู่สินค้า",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateInventoryCategory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลหมวดหมู่สินค้า",
    };
  }
}

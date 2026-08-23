"use server";

import { db } from "@/db";
import { InventoryCategoryForm } from "../types/inventory-category";
import { inventoryCategories } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";

export async function createInventoryCategory(
  data: InventoryCategoryForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างหมวดหมู่สินค้า",
      };
    }

    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return {
        success: false,
        error: "กรุณาระบุชื่อหมวดหมู่สินค้า",
      };
    }

    await db.insert(inventoryCategories).values({
      name: trimmedName,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createInventoryCategory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่สินค้า",
    };
  }
}

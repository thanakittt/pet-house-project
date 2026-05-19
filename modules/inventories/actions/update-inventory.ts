"use server";

import { db } from "@/db";
import { InventoryForm } from "../types/inventory";
import { inventoryCategories, inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { validateInventoryNumbers } from "../utils/validation";
import { INVENTORY_UNITS } from "../constants/units";

export async function updateInventory(
  id: string,
  data: InventoryForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขสินค้าคงคลัง",
      };
    }

    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return {
        success: false,
        error: "กรุณาระบุชื่อสินค้า",
      };
    }

    if (!data.inventoryCategoryId) {
      return {
        success: false,
        error: "กรุณาระบุหมวดหมู่สินค้า",
      };
    }

    if (data.quantity === "") {
      return {
        success: false,
        error: "กรุณาระบุจำนวนสินค้า",
      };
    }

    if (data.reorderLevel === "") {
      return {
        success: false,
        error: "กรุณาระบุจุดสั่งซื้อ",
      };
    }

    const quantity = data.quantity;
    const reorderLevel = data.reorderLevel;

    const validationError = validateInventoryNumbers(quantity, reorderLevel);
    if (validationError) {
      return validationError;
    }

    const isValidUnit = INVENTORY_UNITS.some((u) => u.value === data.unit);
    if (!isValidUnit) {
      return {
        success: false,
        error: "หน่วยสินค้าไม่ถูกต้อง",
      };
    }

    const result = await db.transaction(async (tx) => {
      // ตรวจสอบว่าหมวดหมู่มีอยู่จริงและไม่ได้ถูกลบ
      const [category] = await tx
        .select({ id: inventoryCategories.id })
        .from(inventoryCategories)
        .where(
          and(
            eq(inventoryCategories.id, data.inventoryCategoryId),
            isNull(inventoryCategories.deletedAt),
          ),
        )
        .for("update");

      if (!category) {
        throw new Error("หมวดหมู่สินค้าไม่ถูกต้องหรือถูกลบแล้ว");
      }

      const updated = await tx
        .update(inventoryItems)
        .set({
          name: trimmedName,
          quantity,
          unit: data.unit,
          reorderLevel,
          inventoryCategoryId: data.inventoryCategoryId,
        })
        .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)))
        .returning({ id: inventoryItems.id });

      return updated;
    });

    if (!result.length) {
      return {
        success: false,
        error: "ไม่พบสินค้าที่ต้องการแก้ไข หรือถูกลบไปแล้ว",
      };
    }

    revalidatePath("/inventories");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateInventory error:", error);

    if (
      error instanceof Error &&
      error.message === "หมวดหมู่สินค้าไม่ถูกต้องหรือถูกลบแล้ว"
    ) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขสินค้าคงคลัง",
    };
  }
}

"use server";

import { db } from "@/db";
import { InventoryForm } from "../types/inventory";
import { inventoryCategories, inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { INVENTORY_UNITS } from "../constants/units";
import { validateInventoryNumbers } from "../utils/validation";

export async function createInventory(
  data: InventoryForm,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างสินค้าคงคลัง",
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
        error: "กรุณาระบุจำนวน",
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

    // Wrap the check and insert inside a single database transaction
    await db.transaction(async (tx) => {
      // Step 1: Select and lock the category row using FOR UPDATE
      const [category] = await tx
        .select({ id: inventoryCategories.id })
        .from(inventoryCategories)
        .where(
          and(
            eq(inventoryCategories.id, data.inventoryCategoryId),
            isNull(inventoryCategories.deletedAt),
          ),
        )
        .for("update"); // <-- Prevents concurrent soft-deletes

      // Step 2: Validate existence
      if (!category) {
        throw new Error("ไม่พบหมวดหมู่สินค้า หรือถูกลบไปแล้ว");
      }

      // Step 3: Insert the inventory item securely
      await tx.insert(inventoryItems).values({
        name: trimmedName,
        quantity,
        unit: data.unit,
        reorderLevel,
        inventoryCategoryId: data.inventoryCategoryId,
      });
    });

    revalidatePath("/inventories");
    return { success: true, data: null };
  } catch (error) {
    console.error("createInventory error:", error);

    if (
      error instanceof Error &&
      error.message === "ไม่พบหมวดหมู่สินค้า หรือถูกลบไปแล้ว"
    ) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสินค้าคงคลัง",
    };
  }
}

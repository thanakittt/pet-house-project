"use server";

import { db } from "@/db";
import { InventoryForm } from "../types/inventory";
import { inventoryCategories, inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { INVENTORY_UNITS } from "../constants/units";

export async function createInventory(
  data: InventoryForm
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

    if (data.quantity < 0) {
      return {
        success: false,
        error: "จำนวนสินค้าไม่สามารถติดลบได้",
      };
    }

    if (data.reorderLevel < 0) {
      return {
        success: false,
        error: "จุดสั่งซื้อไม่สามารถติดลบได้",
      };
    }

    const isValidUnit = INVENTORY_UNITS.some((u) => u.value === data.unit);
    if (!isValidUnit) {
      return {
        success: false,
        error: "หน่วยสินค้าไม่ถูกต้อง",
      };
    }

    const [category] = await db
      .select({ id: inventoryCategories.id })
      .from(inventoryCategories)
      .where(
        and(
          eq(inventoryCategories.id, data.inventoryCategoryId),
          isNull(inventoryCategories.deletedAt)
        )
      );

    if (!category) {
      return {
        success: false,
        error: "ไม่พบหมวดหมู่สินค้า หรือถูกลบไปแล้ว",
      };
    }

    await db.insert(inventoryItems).values({
      name: trimmedName,
      quantity: data.quantity,
      unit: data.unit,
      reorderLevel: data.reorderLevel,
      inventoryCategoryId: data.inventoryCategoryId,
    });

    revalidatePath("/inventories");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createInventory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสินค้าคงคลัง",
    };
  }
}

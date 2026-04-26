"use server";

import { db } from "@/db";
import { InventoryForm } from "../types/inventory";
import { inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

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

    await db
      .update(inventoryItems)
      .set({
        name: trimmedName,
        quantity: data.quantity,
        unit: data.unit,
        reorderLevel: data.reorderLevel,
        inventoryCategoryId: data.inventoryCategoryId,
      })
      .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deletedAt)));

    revalidatePath("/inventories");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateInventory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขสินค้าคงคลัง",
    };
  }
}

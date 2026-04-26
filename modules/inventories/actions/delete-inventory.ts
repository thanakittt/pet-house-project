"use server";

import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function deleteInventory(
  id: string,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการลบสินค้าคงคลัง",
      };
    }

    const result = await db
      .update(inventoryItems)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning({ id: inventoryItems.id });

    if (!result.length) {
      return {
        success: false,
        error: "ไม่พบสินค้าคงคลัง",
      };
    }

    revalidatePath("/inventories");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteInventory error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบสินค้าคงคลัง",
    };
  }
}

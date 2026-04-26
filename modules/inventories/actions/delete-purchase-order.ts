"use server";

import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

/**
 * deletePurchaseOrder — ลบใบสั่งซื้อ (soft delete)
 * - อนุญาตเฉพาะ DRAFT เท่านั้น
 * - ใบสั่งซื้อที่ ORDERED / RECEIVED / CANCELLED ลบไม่ได้
 */
export async function deletePurchaseOrder(
  id: string
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการลบใบสั่งซื้อ",
      };
    }

    // ── ดึง PO ปัจจุบันเพื่อตรวจสอบสถานะและความมีอยู่ ──
    const [order] = await db
      .select({ id: purchaseOrders.id, status: purchaseOrders.status })
      .from(purchaseOrders)
      .where(
        and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt))
      );

    if (!order) {
      return {
        success: false,
        error: "ไม่พบใบสั่งซื้อที่ระบุ หรือถูกลบไปแล้ว",
      };
    }

    // ── อนุญาตให้ลบเฉพาะ DRAFT เท่านั้น ──
    if (order.status !== "DRAFT") {
      return {
        success: false,
        error: "ไม่สามารถลบใบสั่งซื้อได้ เนื่องจากสถานะไม่ใช่ 'ร่าง'",
      };
    }

    // ── Soft delete: set deletedAt = now() ──
    await db
      .update(purchaseOrders)
      .set({ deletedAt: new Date() })
      .where(eq(purchaseOrders.id, id));

    revalidatePath("/inventories");

    return { success: true, data: null };
  } catch (error) {
    console.error("deletePurchaseOrder error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบใบสั่งซื้อ",
    };
  }
}

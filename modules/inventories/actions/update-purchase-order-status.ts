"use server";

import { db } from "@/db";
import {
  inventoryItems,
  purchaseOrderItems,
  purchaseOrders,
} from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  isValidPurchaseOrderStatus,
  PurchaseOrderStatus,
} from "../constants/purchase-order-status";

/**
 * กฎ transition: บอกว่าจาก status ใดไปได้ status ไหนบ้าง
 * ป้องกันการกระโดดข้ามสถานะ เช่น DRAFT → RECEIVED โดยตรง
 */
const ALLOWED_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> =
  {
    DRAFT: ["ORDERED", "CANCELLED"],
    ORDERED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [], // terminal — ไม่สามารถเปลี่ยนสถานะได้อีก
    CANCELLED: [], // terminal — ไม่สามารถเปลี่ยนสถานะได้อีก
  };

/**
 * updatePurchaseOrderStatus — อัปเดตสถานะใบสั่งซื้อ
 * - ตรวจสอบว่า status ใหม่อยู่ใน allowed transitions ของ status ปัจจุบัน
 * - ป้องกัน terminal states จากการถูกเปลี่ยน
 */
export async function updatePurchaseOrderStatus(
  id: string,
  newStatus: PurchaseOrderStatus,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขสถานะใบสั่งซื้อ",
      };
    }

    // ── Validate: newStatus ต้องเป็นค่าที่ถูกต้อง ──
    if (!isValidPurchaseOrderStatus(newStatus)) {
      return {
        success: false,
        error: "สถานะที่ระบุไม่ถูกต้อง",
      };
    }

    // ── ดึง PO ปัจจุบันเพื่อตรวจสอบสถานะ ──
    const [order] = await db
      .select({ status: purchaseOrders.status })
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt)));

    if (!order) {
      return {
        success: false,
        error: "ไม่พบใบสั่งซื้อที่ระบุ",
      };
    }

    const currentStatus = order.status as PurchaseOrderStatus;

    // ── ตรวจสอบว่า transition นี้อนุญาตหรือไม่ ──
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `ไม่สามารถเปลี่ยนสถานะจาก "${currentStatus}" ไป "${newStatus}" ได้`,
      };
    }

    // ── Update สถานะ ──
    await db.transaction(async (tx) => {
      // 1. Update สถานะใบสั่งซื้อ
      await tx
        .update(purchaseOrders)
        .set({ status: newStatus })
        .where(eq(purchaseOrders.id, id));

      // 2. ถ้าสถานะเปลี่ยนเป็น RECEIVED ให้เพิ่มสินค้าเข้า inventory
      if (newStatus === "RECEIVED") {
        // ดึงรายละเอียดสินค้าในใบสั่งซื้อ
        const items = await tx
          .select({
            inventoryItemId: purchaseOrderItems.inventoryItemId,
            quantity: purchaseOrderItems.quantity,
          })
          .from(purchaseOrderItems)
          .where(
            and(
              eq(purchaseOrderItems.purchaseOrderId, id),
              isNull(purchaseOrderItems.deletedAt),
            ),
          );

        // Update จำนวนคงคลัง
        for (const item of items) {
          await tx
            .update(inventoryItems)
            .set({
              quantity: sql`${inventoryItems.quantity} + ${item.quantity}`,
            })
            .where(
              and(
                eq(inventoryItems.id, item.inventoryItemId),
                isNull(inventoryItems.deletedAt),
              ),
            );
        }
      }
    });

    revalidatePath("/inventories");

    return { success: true, data: null };
  } catch (error) {
    console.error("updatePurchaseOrderStatus error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตสถานะใบสั่งซื้อ",
    };
  }
}

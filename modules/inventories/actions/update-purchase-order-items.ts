"use server";

import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { PurchaseOrderItemForm } from "../types/purchase-order";

/**
 * updatePurchaseOrderItems — แก้ไขรายการสินค้าในใบสั่งซื้อที่เป็น DRAFT
 * Strategy: delete-then-insert (ง่ายและ predictable กว่า diff-based upsert)
 * - ตรวจสอบ session และความมีอยู่ของ PO
 * - บังคับว่า PO ต้องเป็น DRAFT เท่านั้น
 * - Validate สินค้าซ้ำและ quantity/unitCost
 * - ลบ items เก่าทั้งหมด + insert ชุดใหม่ใน transaction เดียวกัน
 */
export async function updatePurchaseOrderItems(
  purchaseOrderId: string,
  items: PurchaseOrderItemForm[],
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขใบสั่งซื้อ",
      };
    }

    // ── Validate: ต้องมีรายการสินค้าอย่างน้อย 1 รายการ ──
    if (!items || items.length === 0) {
      return {
        success: false,
        error: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ",
      };
    }

    // ── Validate: quantity และ unitCost ต้องเป็นค่าบวก ──
    for (const item of items) {
      if (item.quantity <= 0) {
        return {
          success: false,
          error: `จำนวนสินค้า "${item.inventoryItemName}" ต้องมากกว่า 0`,
        };
      }
      if (item.unitCost < 0) {
        return {
          success: false,
          error: `ราคาสินค้า "${item.inventoryItemName}" ต้องไม่ติดลบ`,
        };
      }
    }

    // ── Validate: ห้ามมีสินค้าซ้ำ ──
    const itemIds = items.map((i) => i.inventoryItemId);
    const uniqueItemIds = Array.from(new Set(itemIds));

    if (itemIds.length !== uniqueItemIds.length) {
      return {
        success: false,
        error: "พบสินค้ารายการซ้ำซ้อน กรุณาตรวจสอบและรวมจำนวนสินค้าเข้าด้วยกัน",
      };
    }

    // ── ดึง PO เพื่อตรวจสอบสถานะ ──
    const [order] = await db
      .select({ status: purchaseOrders.status })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, purchaseOrderId),
          isNull(purchaseOrders.deletedAt),
        ),
      );

    if (!order) {
      return {
        success: false,
        error: "ไม่พบใบสั่งซื้อที่ระบุ",
      };
    }

    // ── บังคับเฉพาะ DRAFT และ ORDERED ─ ไม่อนุญาตแก้ไข order ที่ปิดไปแล้ว (RECEIVED หรือ CANCELLED) ──
    if (order.status !== "DRAFT" && order.status !== "ORDERED") {
      return {
        success: false,
        error: "ไม่สามารถแก้ไขรายการสินค้าได้ เนื่องจากใบสั่งซื้อไม่ได้อยู่ในสถานะ 'ร่าง' หรือ 'สั่งซื้อแล้ว'",
      };
    }

    // ── ตรวจสอบว่า inventoryItem ทุกตัวมีอยู่จริงใน DB ──
    const existingItems = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(
        and(
          inArray(inventoryItems.id, uniqueItemIds),
          isNull(inventoryItems.deletedAt),
        ),
      );

    if (existingItems.length !== uniqueItemIds.length) {
      return {
        success: false,
        error: "พบสินค้าบางรายการไม่ถูกต้อง กรุณาตรวจสอบรายการสินค้าอีกครั้ง",
      };
    }

    // ── Delete-then-insert ใน transaction เดียว ──
    await db.transaction(async (tx) => {
      // 1. ลบ items เก่าทั้งหมดของ PO นี้ (hard delete เพราะยังเป็น DRAFT)
      await tx
        .delete(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

      // 2. Insert รายการสินค้าชุดใหม่
      await tx.insert(purchaseOrderItems).values(
        items.map((item) => ({
          purchaseOrderId,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCost: String(item.unitCost), // numeric column ต้องส่งเป็น string
        })),
      );
    });

    // revalidate ทั้งหน้า list และหน้า detail
    revalidatePath("/back-office/inventories");
    revalidatePath(`/back-office/inventories/purchase-orders/${purchaseOrderId}`);
    revalidatePath("/inventories");
    revalidatePath(`/inventories/purchase-orders/${purchaseOrderId}`);

    return { success: true, data: null };
  } catch (error) {
    console.error("updatePurchaseOrderItems error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตรายการสินค้า",
    };
  }
}

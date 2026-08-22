"use server";

import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, inventoryItems } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { PurchaseOrderForm } from "../types/purchase-order";
import { staffs } from "@/db/schema/staff";

/**
 * createPurchaseOrder — สร้างใบสั่งซื้อใหม่
 * - ตรวจสอบ session ก่อน
 * - Validate ข้อมูล input
 * - ตรวจสอบว่า inventoryItem ทุกตัวมีอยู่จริง
 * - Insert purchaseOrders + purchaseOrderItems ใน transaction เดียวกัน
 */
export async function createPurchaseOrder(
  data: PurchaseOrderForm
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างใบสั่งซื้อ",
      };
    }

    // ── Validate: ต้องมีรายการสินค้าอย่างน้อย 1 รายการ ──
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ",
      };
    }

    // ── Validate: วันที่สั่งซื้อต้องไม่ว่าง ──
    if (!data.orderDate) {
      return {
        success: false,
        error: "กรุณาระบุวันที่สั่งซื้อ",
      };
    }

    // ── Validate: quantity และ unitCost ต้องเป็นค่าบวก ──
    for (const item of data.items) {
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

    // ── ดึง staffId จาก userId ในฐานข้อมูล ──
    const [staffRow] = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.userId, session.user.id));

    if (!staffRow) {
      return {
        success: false,
        error: "ไม่พบข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ",
      };
    }

    // ── ตรวจสอบว่ามีสินค้าซ้ำซ้อนหรือไม่ ──
    const itemIds = data.items.map((i) => i.inventoryItemId);
    const uniqueItemIds = Array.from(new Set(itemIds));

    if (itemIds.length !== uniqueItemIds.length) {
      return {
        success: false,
        error: "พบสินค้ารายการซ้ำซ้อน กรุณาตรวจสอบและรวมจำนวนสินค้าเข้าด้วยกัน",
      };
    }

    // ── ตรวจสอบว่า inventoryItem ทุกตัวมีอยู่จริงใน DB ──
    const existingItems = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(
        and(
          inArray(inventoryItems.id, uniqueItemIds),
          isNull(inventoryItems.deletedAt)
        )
      );

    // เช็คว่าหา item ครบทุกตัวหรือไม่
    if (existingItems.length !== uniqueItemIds.length) {
      return {
        success: false,
        error: "พบสินค้าบางรายการไม่ถูกต้อง กรุณาตรวจสอบรายการสินค้าอีกครั้ง",
      };
    }

    // ── Insert ใน transaction เพื่อความ atomic ──
    const result = await db.transaction(async (tx) => {
      // 1. Insert ใบสั่งซื้อหลัก
      const [newOrder] = await tx
        .insert(purchaseOrders)
        .values({
          orderDate: data.orderDate,
          status: "DRAFT", // เริ่มต้นเป็น DRAFT เสมอ
          staffId: staffRow.id,
        })
        .returning({ id: purchaseOrders.id });

      // 2. Insert รายการสินค้าทั้งหมดในใบสั่งซื้อนี้
      await tx.insert(purchaseOrderItems).values(
        data.items.map((item) => ({
          purchaseOrderId: newOrder.id,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCost: String(item.unitCost), // numeric column ต้องส่งเป็น string
        }))
      );

      return newOrder;
    });

    // revalidate หน้า inventory เพื่อให้ list อัปเดต
    revalidatePath("/inventories");

    return {
      success: true,
      data: { id: result.id },
    };
  } catch (error) {
    console.error("createPurchaseOrder error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ",
    };
  }
}

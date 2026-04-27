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
import { and, eq, inArray, isNull, sql, SQL } from "drizzle-orm";
import {
  isValidPurchaseOrderStatus,
  PurchaseOrderStatus,
} from "../constants/purchase-order-status";

const ALLOWED_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> =
  {
    DRAFT: ["ORDERED", "CANCELLED"],
    ORDERED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [], // terminal — ไม่สามารถเปลี่ยนสถานะได้อีก
    CANCELLED: [], // terminal — ไม่สามารถเปลี่ยนสถานะได้อีก
  };

// ขีดจำกัดสูงสุดของ SmallInt ใน PostgreSQL
const MAX_SMALLINT = 32767;

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

    if (!isValidPurchaseOrderStatus(newStatus)) {
      return {
        success: false,
        error: "สถานะที่ระบุไม่ถูกต้อง",
      };
    }

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

    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `ไม่สามารถเปลี่ยนสถานะจาก "${currentStatus}" ไป "${newStatus}" ได้`,
      };
    }

    // ทำทุกอย่างภายใต้ Transaction เพื่อความเป็น Atomic
    await db.transaction(async (tx) => {
      // 1. Update สถานะใบสั่งซื้อ
      await tx
        .update(purchaseOrders)
        .set({ status: newStatus })
        .where(eq(purchaseOrders.id, id));

      // 2. ถ้าสถานะเปลี่ยนเป็น RECEIVED ให้เพิ่มสินค้าเข้า inventory
      if (newStatus === "RECEIVED") {
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

        if (items.length > 0) {
          const itemIds = items.map((item) => item.inventoryItemId);

          // 3. Lock แถวของสินค้าคงคลังด้วย FOR UPDATE ป้องกัน Race Condition
          const lockedInventoryItems = await tx
            .select({
              id: inventoryItems.id,
              name: inventoryItems.name,
              quantity: inventoryItems.quantity,
            })
            .from(inventoryItems)
            .where(
              and(
                inArray(inventoryItems.id, itemIds),
                isNull(inventoryItems.deletedAt),
              ),
            )
            .for("update");

          // 4. Validate ข้อมูลเพื่อป้องกัน SmallInt Overflow (เกิน 32767)
          for (const lockedItem of lockedInventoryItems) {
            const orderItem = items.find(
              (i) => i.inventoryItemId === lockedItem.id,
            );
            if (orderItem) {
              const totalQuantity = lockedItem.quantity + orderItem.quantity;
              if (totalQuantity > MAX_SMALLINT) {
                // โยน Error ออกไปให้ Catch จับเพื่อยกเลิก Transaction (Rollback)
                throw new Error(
                  `สินค้า "${lockedItem.name}" จะมีจำนวน (${totalQuantity}) ซึ่งเกินขีดจำกัดของระบบ (${MAX_SMALLINT})`,
                );
              }
            }
          }

          // 5. เตรียมคำสั่ง Batch Update ด้วย CASE Statement ลดภาระฐานข้อมูล
          const sqlChunks: SQL[] = [sql`(CASE id`];
          for (const item of items) {
            sqlChunks.push(
              sql`WHEN ${item.inventoryItemId} THEN quantity + ${item.quantity}::integer`,
            );
          }
          sqlChunks.push(sql`END)`);

          const caseStatement = sql.join(sqlChunks, sql` `);

          // ทำการ Update ทีเดียวรวด
          await tx
            .update(inventoryItems)
            .set({ quantity: caseStatement })
            .where(inArray(inventoryItems.id, itemIds));
        }
      }
    });

    revalidatePath("/inventories");

    return { success: true, data: null };
  } catch (error: any) {
    console.error("updatePurchaseOrderStatus error:", error);

    // ส่งข้อความ Overflow กลับไปที่ Client หากเกิดข้อผิดพลาดในการคำนวณจำนวน
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("เกินขีดจำกัด")) {
      return { success: false, error: errorMessage };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตสถานะใบสั่งซื้อ",
    };
  }
}

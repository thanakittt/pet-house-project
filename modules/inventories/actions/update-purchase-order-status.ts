"use server";

import { db } from "@/db";
import {
  inventoryItems,
  purchaseOrderIssues,
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
import { recordTransaction } from "@/lib/finance/record-transaction";
import { insertPurchaseOrderLog } from "../utils/insert-purchase-order-log";
import { staffs } from "@/db/schema/staff";

const ALLOWED_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> =
  {
    DRAFT: ["ORDERED", "CANCELLED"],
    ORDERED: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
    PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
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

    // ดึง staffId จาก session
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

    const transactionResult = await db.transaction(
      async (tx): Promise<ActionResponse<null>> => {
        // 1. อ่านสถานะปัจจุบันของใบสั่งซื้อ พร้อมล็อกแถวข้อมูลด้วย FOR UPDATE
        const [order] = await tx
          .select({ status: purchaseOrders.status })
          .from(purchaseOrders)
          .where(
            and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt)),
          )
          .for("update");

        if (!order) {
          return {
            success: false,
            error: "ไม่พบใบสั่งซื้อที่ระบุ",
          };
        }

        const currentStatus = order.status as PurchaseOrderStatus;

        // 2. ตรวจสอบเงื่อนไข State Machine
        const allowed = ALLOWED_TRANSITIONS[currentStatus];
        if (!allowed.includes(newStatus)) {
          return {
            success: false,
            error: `ไม่สามารถเปลี่ยนสถานะจาก "${currentStatus}" ไป "${newStatus}" ได้`,
          };
        }

        // 3. Update สถานะใบสั่งซื้อ พร้อมระบุ currentStatus เพื่อป้องกัน Concurrency
        await tx
          .update(purchaseOrders)
          .set({ status: newStatus })
          .where(
            and(
              eq(purchaseOrders.id, id),
              eq(purchaseOrders.status, currentStatus),
            ),
          );

        // 4. ถ้าสถานะเปลี่ยนเป็น RECEIVED ให้เพิ่มสินค้าเข้า inventory เฉพาะส่วนที่ยังไม่ได้รับ
        if (newStatus === "RECEIVED") {
          const items = await tx
            .select({
              id: purchaseOrderItems.id,
              inventoryItemId: purchaseOrderItems.inventoryItemId,
              quantity: purchaseOrderItems.quantity,
              receivedQuantity: purchaseOrderItems.receivedQuantity,
              unitCost: purchaseOrderItems.unitCost,
            })
            .from(purchaseOrderItems)
            .where(
              and(
                eq(purchaseOrderItems.purchaseOrderId, id),
                isNull(purchaseOrderItems.deletedAt),
              ),
            );

          if (items.length > 0) {
            // 5. Aggregate: รวมจำนวนปริมาณสินค้าที่ค้างรับในกรณีที่มี Item ID ซ้ำกันใน PO
            const aggregatedItems = new Map<string, number>();
            let totalAdditionalExpense = 0;

            for (const item of items) {
              const remaining = Math.max(0, item.quantity - item.receivedQuantity);
              if (remaining > 0) {
                const currentQty = aggregatedItems.get(item.inventoryItemId) || 0;
                aggregatedItems.set(
                  item.inventoryItemId,
                  currentQty + remaining,
                );
                totalAdditionalExpense += remaining * parseFloat(item.unitCost);
              }
            }

            const uniqueItemIds = Array.from(aggregatedItems.keys());

            if (uniqueItemIds.length > 0) {
              // 6. Lock แถวของสินค้าคงคลังด้วย FOR UPDATE โดยใช้ ID ที่ไม่ซ้ำ
              const lockedInventoryItems = await tx
                .select({
                  id: inventoryItems.id,
                  name: inventoryItems.name,
                  quantity: inventoryItems.quantity,
                })
                .from(inventoryItems)
                .where(
                  and(
                    inArray(inventoryItems.id, uniqueItemIds),
                    isNull(inventoryItems.deletedAt),
                  ),
                )
                .for("update");

              // 7. Verify Integrity: ตรวจสอบว่าสินค้าที่พบครบตามจำนวน Unique ID ที่ขอไปหรือไม่
              if (lockedInventoryItems.length !== uniqueItemIds.length) {
                throw new Error(
                  "ไม่พบสินค้าบางรายการ หรือมีสินค้าที่ถูกลบออกจากระบบไปแล้ว",
                );
              }

              // 8. Validate ป้องกัน SmallInt Overflow ผ่านข้อมูลที่รวมไว้ (Aggregated Map)
              for (const lockedItem of lockedInventoryItems) {
                const incomingQuantity = aggregatedItems.get(lockedItem.id) || 0;
                const totalQuantity = lockedItem.quantity + incomingQuantity;

                if (totalQuantity > MAX_SMALLINT) {
                  throw new Error(
                    `สินค้า "${lockedItem.name}" จะมีจำนวน (${totalQuantity}) ซึ่งเกินขีดจำกัดของระบบ (${MAX_SMALLINT})`,
                  );
                }
              }

              // 9. เตรียมคำสั่ง Batch Update ด้วย CASE Statement จาก Map ที่ไม่ซ้ำ
              const sqlChunks: SQL[] = [sql`(CASE id`];
              for (const [
                itemId,
                totalIncomingQty,
              ] of aggregatedItems.entries()) {
                sqlChunks.push(
                  sql`WHEN ${itemId} THEN quantity + ${totalIncomingQty}::integer`,
                );
              }
              sqlChunks.push(sql`END)`);

              const caseStatement = sql.join(sqlChunks, sql` `);

              // 10. ทำการ Update รวดเดียว โดยระบุ where ให้ตรงกับชุดที่ล็อกไว้เป๊ะๆ
              await tx
                .update(inventoryItems)
                .set({ quantity: caseStatement })
                .where(
                  and(
                    inArray(inventoryItems.id, uniqueItemIds),
                    isNull(inventoryItems.deletedAt),
                  ),
                );
            }

            // อัปเดต receivedQuantity ของทุกรายการใน PO ให้เท่ากับ quantity
            await tx
              .update(purchaseOrderItems)
              .set({ receivedQuantity: sql`${purchaseOrderItems.quantity}` })
              .where(
                and(
                  eq(purchaseOrderItems.purchaseOrderId, id),
                  isNull(purchaseOrderItems.deletedAt),
                ),
              );

            // บันทึก transaction รายจ่ายเฉพาะเมื่อมียอดเพิ่มเติม > 0
            if (totalAdditionalExpense > 0) {
              await recordTransaction(tx, {
                amount: totalAdditionalExpense,
                transactionDate: new Date(),
                categoryType: "EXPENSE",
                categoryName: "ค่าสั่งซื้อสินค้าคลัง",
                note: `รับสินค้าใบสั่งซื้อ #${id}`,
              });
            }
          }

          // ปิด issue ที่เปิดค้างอยู่ของ PO นี้
          await tx
            .update(purchaseOrderIssues)
            .set({
              status: "RESOLVED",
              resolutionType: "ALL_ITEMS_RECEIVED",
              resolvedAt: new Date(),
              resolvedBy: staffRow.id,
              receivedQuantity: sql`ordered_quantity`,
              shortageQuantity: 0,
            })
            .where(
              and(
                eq(purchaseOrderIssues.purchaseOrderId, id),
                eq(purchaseOrderIssues.status, "OPEN"),
              ),
            );
        }

        // บันทึก log STATUS_CHANGED
        await insertPurchaseOrderLog(tx, {
          purchaseOrderId: id,
          staffId: staffRow.id,
          event: "STATUS_CHANGED",
          fromStatus: currentStatus,
          toStatus: newStatus,
        });

        return { success: true, data: null };
      },
    );

    if (transactionResult.success) {
      revalidatePath("/inventories");
    }

    return transactionResult;
  } catch (error) {
    console.error("updatePurchaseOrderStatus error:", error);

    const errorMessage = error instanceof Error ? error.message : "";
    if (
      errorMessage.includes("เกินขีดจำกัด") ||
      errorMessage.includes("ไม่พบสินค้าบางรายการ")
    ) {
      return { success: false, error: errorMessage };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตสถานะใบสั่งซื้อ",
    };
  }
}

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
import { PurchaseOrderStatus } from "../constants/purchase-order-status";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { insertPurchaseOrderLog } from "../utils/insert-purchase-order-log";
import { staffs } from "@/db/schema/staff";
import { z } from "zod";

const MAX_SMALLINT = 32767;

const receivePurchaseOrderItemInputSchema = z.object({
  purchaseOrderItemId: z.string().uuid("รหัสรายการสินค้าไม่ถูกต้อง"),
  receivedQuantity: z
    .number({ message: "จำนวนสินค้าต้องเป็นตัวเลข" })
    .int("จำนวนสินค้าต้องเป็นจำนวนเต็ม")
    .min(0, "จำนวนสินค้าต้องไม่ติดลบ"),
});

const receivePurchaseOrderItemsSchema = z.object({
  purchaseOrderId: z.string().uuid("รหัสใบสั่งซื้อไม่ถูกต้อง"),
  items: z
    .array(receivePurchaseOrderItemInputSchema)
    .min(1, "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ"),
});

export type ReceivePurchaseOrderItemsInput = z.infer<
  typeof receivePurchaseOrderItemsSchema
>;

export async function receivePurchaseOrderItems(
  input: ReceivePurchaseOrderItemsInput,
): Promise<ActionResponse<{ status: PurchaseOrderStatus }>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการรับสินค้า",
      };
    }

    const parseResult = receivePurchaseOrderItemsSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    const { purchaseOrderId, items: inputItems } = parseResult.data;

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
      async (tx): Promise<ActionResponse<{ status: PurchaseOrderStatus }>> => {
        // 1. Lock แถวข้อมูลใบสั่งซื้อ
        const [order] = await tx
          .select({
            id: purchaseOrders.id,
            status: purchaseOrders.status,
          })
          .from(purchaseOrders)
          .where(
            and(
              eq(purchaseOrders.id, purchaseOrderId),
              isNull(purchaseOrders.deletedAt),
            ),
          )
          .for("update");

        if (!order) {
          return {
            success: false,
            error: "ไม่พบใบสั่งซื้อที่ระบุ",
          };
        }

        const currentStatus = order.status as PurchaseOrderStatus;
        if (
          currentStatus !== "ORDERED" &&
          currentStatus !== "PARTIALLY_RECEIVED"
        ) {
          return {
            success: false,
            error: `ไม่สามารถรับสินค้าสำหรับใบสั่งซื้อที่มีสถานะ "${currentStatus}" ได้`,
          };
        }

        // 2. Lock รายการสินค้าทั้งหมดในใบสั่งซื้อนี้
        const poItems = await tx
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
              eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
              isNull(purchaseOrderItems.deletedAt),
            ),
          )
          .for("update");

        if (poItems.length === 0) {
          return {
            success: false,
            error: "ใบสั่งซื้อนี้ไม่มีรายการสินค้า",
          };
        }

        const poItemMap = new Map(poItems.map((item) => [item.id, item]));

        // ตรวจสอบความถูกต้องของแต่ละรายการที่ส่งมา
        const inputMap = new Map<string, number>();
        let totalNewlyReceived = 0;

        for (const inputItem of inputItems) {
          const poItem = poItemMap.get(inputItem.purchaseOrderItemId);
          if (!poItem) {
            return {
              success: false,
              error: `ไม่พบรายการสินค้า #${inputItem.purchaseOrderItemId} ในใบสั่งซื้อนี้`,
            };
          }

          const remaining = poItem.quantity - poItem.receivedQuantity;
          if (inputItem.receivedQuantity > remaining) {
            return {
              success: false,
              error: `จำนวนรับ (${inputItem.receivedQuantity}) เกินจำนวนที่ค้างส่ง (${remaining})`,
            };
          }

          inputMap.set(inputItem.purchaseOrderItemId, inputItem.receivedQuantity);
          totalNewlyReceived += inputItem.receivedQuantity;
        }

        if (totalNewlyReceived <= 0) {
          return {
            success: false,
            error: "กรุณาระบุจำนวนสินค้าที่ได้รับอย่างน้อย 1 รายการ",
          };
        }

        // 3. รวมจำนวนสินค้าที่ได้รับเข้าคลังแยกตาม inventoryItemId
        const aggregatedIncoming = new Map<string, number>();
        let batchTotalExpense = 0;

        for (const [poItemId, receivedQty] of inputMap.entries()) {
          if (receivedQty > 0) {
            const poItem = poItemMap.get(poItemId)!;
            const existingQty = aggregatedIncoming.get(poItem.inventoryItemId) || 0;
            aggregatedIncoming.set(poItem.inventoryItemId, existingQty + receivedQty);
            batchTotalExpense += receivedQty * parseFloat(poItem.unitCost);
          }
        }

        const uniqueItemIds = Array.from(aggregatedIncoming.keys());

        // 4. Lock สินค้าคงคลังใน inventoryItems
        if (uniqueItemIds.length > 0) {
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

          if (lockedInventoryItems.length !== uniqueItemIds.length) {
            throw new Error(
              "ไม่พบสินค้าบางรายการ หรือมีสินค้าที่ถูกลบออกจากระบบไปแล้ว",
            );
          }

          for (const lockedItem of lockedInventoryItems) {
            const incomingQuantity = aggregatedIncoming.get(lockedItem.id) || 0;
            const totalQuantity = lockedItem.quantity + incomingQuantity;

            if (totalQuantity > MAX_SMALLINT) {
              throw new Error(
                `สินค้า "${lockedItem.name}" จะมีจำนวน (${totalQuantity}) ซึ่งเกินขีดจำกัดของระบบ (${MAX_SMALLINT})`,
              );
            }
          }

          // อัปเดต stock ใน inventoryItems
          const sqlChunks: SQL[] = [sql`(CASE id`];
          for (const [itemId, incomingQty] of aggregatedIncoming.entries()) {
            sqlChunks.push(
              sql`WHEN ${itemId} THEN quantity + ${incomingQty}::integer`,
            );
          }
          sqlChunks.push(sql`END)`);

          await tx
            .update(inventoryItems)
            .set({ quantity: sql.join(sqlChunks, sql` `) })
            .where(
              and(
                inArray(inventoryItems.id, uniqueItemIds),
                isNull(inventoryItems.deletedAt),
              ),
            );
        }

        // 5. อัปเดต receivedQuantity ใน purchaseOrderItems
        for (const [poItemId, receivedQty] of inputMap.entries()) {
          if (receivedQty > 0) {
            await tx
              .update(purchaseOrderItems)
              .set({
                receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${receivedQty}`,
              })
              .where(eq(purchaseOrderItems.id, poItemId));
          }
        }

        // 6. บันทึก transaction รายจ่ายตามยอดจริงที่ได้รับรอบนี้
        if (batchTotalExpense > 0) {
          await recordTransaction(tx, {
            amount: batchTotalExpense,
            transactionDate: new Date(),
            categoryType: "EXPENSE",
            categoryName: "ค่าสั่งซื้อสินค้าคลัง",
            note: `รับสินค้าใบสั่งซื้อ #${purchaseOrderId}`,
          });
        }

        // 7. ตรวจสอบสถานะ PO และบันทึก/ปรับปรุง purchaseOrderIssues
        let isFullyReceived = true;

        for (const poItem of poItems) {
          const newlyReceivedForThisItem = inputMap.get(poItem.id) || 0;
          const totalReceivedSoFar = poItem.receivedQuantity + newlyReceivedForThisItem;

          if (totalReceivedSoFar < poItem.quantity) {
            isFullyReceived = false;
            const shortage = poItem.quantity - totalReceivedSoFar;

            // ตรวจสอบว่ามี OPEN issue เดิมอยู่แล้วหรือไม่
            const [existingIssue] = await tx
              .select({ id: purchaseOrderIssues.id })
              .from(purchaseOrderIssues)
              .where(
                and(
                  eq(purchaseOrderIssues.purchaseOrderId, purchaseOrderId),
                  eq(purchaseOrderIssues.purchaseOrderItemId, poItem.id),
                  eq(purchaseOrderIssues.status, "OPEN"),
                ),
              );

            if (existingIssue) {
              await tx
                .update(purchaseOrderIssues)
                .set({
                  receivedQuantity: totalReceivedSoFar,
                  shortageQuantity: shortage,
                })
                .where(eq(purchaseOrderIssues.id, existingIssue.id));
            } else {
              await tx.insert(purchaseOrderIssues).values({
                purchaseOrderId,
                purchaseOrderItemId: poItem.id,
                inventoryItemId: poItem.inventoryItemId,
                orderedQuantity: poItem.quantity,
                receivedQuantity: totalReceivedSoFar,
                shortageQuantity: shortage,
                status: "OPEN",
              });
            }
          } else {
            // ถ้ารายการนี้ได้รับครบแล้ว และเคยมี OPEN issue อยู่ ให้ปิด issue ของรายการนี้
            await tx
              .update(purchaseOrderIssues)
              .set({
                status: "RESOLVED",
                resolutionType: "ALL_ITEMS_RECEIVED",
                resolvedAt: new Date(),
                resolvedBy: staffRow.id,
                receivedQuantity: totalReceivedSoFar,
                shortageQuantity: 0,
              })
              .where(
                and(
                  eq(purchaseOrderIssues.purchaseOrderId, purchaseOrderId),
                  eq(purchaseOrderIssues.purchaseOrderItemId, poItem.id),
                  eq(purchaseOrderIssues.status, "OPEN"),
                ),
              );
          }
        }

        const nextStatus: PurchaseOrderStatus = isFullyReceived
          ? "RECEIVED"
          : "PARTIALLY_RECEIVED";

        // 8. อัปเดตสถานะใบสั่งซื้อ
        await tx
          .update(purchaseOrders)
          .set({ status: nextStatus })
          .where(eq(purchaseOrders.id, purchaseOrderId));

        // 9. บันทึก log STATUS_CHANGED
        await insertPurchaseOrderLog(tx, {
          purchaseOrderId,
          staffId: staffRow.id,
          event: "STATUS_CHANGED",
          fromStatus: currentStatus,
          toStatus: nextStatus,
          note:
            nextStatus === "RECEIVED"
              ? "ตรวจรับสินค้าครบถ้วน"
              : currentStatus === "PARTIALLY_RECEIVED"
                ? "ตรวจรับสินค้าเพิ่มเติม (มีสินค้าค้างส่ง)"
                : "ตรวจรับสินค้าบางส่วน (มีสินค้าค้างส่ง)",
        });

        return {
          success: true,
          data: { status: nextStatus },
        };
      },
    );

    if (transactionResult.success) {
      revalidatePath("/inventories");
      revalidatePath(`/inventories/purchase-orders/${input.purchaseOrderId}`);
    }

    return transactionResult;
  } catch (error) {
    console.error("receivePurchaseOrderItems error:", error);

    const errorMessage = error instanceof Error ? error.message : "";
    if (
      errorMessage.includes("เกินขีดจำกัด") ||
      errorMessage.includes("ไม่พบสินค้าบางรายการ")
    ) {
      return { success: false, error: errorMessage };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกการรับสินค้า",
    };
  }
}

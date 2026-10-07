"use server";

import { db } from "@/db";
import {
  purchaseOrderIssues,
  purchaseOrderItems,
  purchaseOrders,
} from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { PurchaseOrderStatus } from "../constants/purchase-order-status";
import { insertPurchaseOrderLog } from "../utils/insert-purchase-order-log";
import { staffs } from "@/db/schema/staff";
import {
  resolvePurchaseOrderDiscrepancySchema,
  type ResolvePurchaseOrderDiscrepancyInput,
} from "../types/purchase-order";
import { RESOLUTION_TYPE_CONFIG } from "../constants/purchase-order-issue";

export async function resolvePurchaseOrderDiscrepancy(
  input: ResolvePurchaseOrderDiscrepancyInput,
): Promise<ActionResponse<{ status: PurchaseOrderStatus }>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการยุติปัญหาใบสั่งซื้อ",
      };
    }

    const parseResult = resolvePurchaseOrderDiscrepancySchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
      };
    }

    const { purchaseOrderId, resolutionType, resolutionNote } = parseResult.data;

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
        if (currentStatus !== "PARTIALLY_RECEIVED") {
          return {
            success: false,
            error: `ไม่สามารถยุติปัญหาได้ เนื่องจากใบสั่งซื้อมีสถานะ "${currentStatus}" (ต้องอยู่ในสถานะ "รับสินค้าบางส่วน" เท่านั้น)`,
          };
        }

        // 2. Lock รายการสินค้าในใบสั่งซื้อ
        const poItems = await tx
          .select({
            id: purchaseOrderItems.id,
            inventoryItemId: purchaseOrderItems.inventoryItemId,
            quantity: purchaseOrderItems.quantity,
            receivedQuantity: purchaseOrderItems.receivedQuantity,
          })
          .from(purchaseOrderItems)
          .where(
            and(
              eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
              isNull(purchaseOrderItems.deletedAt),
            ),
          )
          .for("update");

        // 3. Lock และดึงรายการ issues เดิม
        const existingIssues = await tx
          .select({
            id: purchaseOrderIssues.id,
            purchaseOrderItemId: purchaseOrderIssues.purchaseOrderItemId,
            status: purchaseOrderIssues.status,
          })
          .from(purchaseOrderIssues)
          .where(
            and(
              eq(purchaseOrderIssues.purchaseOrderId, purchaseOrderId),
              isNull(purchaseOrderIssues.deletedAt),
            ),
          )
          .for("update");

        const now = new Date();

        // 4. อัปเดตรายการ issues ที่ยัง OPEN ทั้งหมดเป็น RESOLVED
        await tx
          .update(purchaseOrderIssues)
          .set({
            status: "RESOLVED",
            resolutionType,
            resolutionNote,
            resolvedAt: now,
            resolvedBy: staffRow.id,
          })
          .where(
            and(
              eq(purchaseOrderIssues.purchaseOrderId, purchaseOrderId),
              eq(purchaseOrderIssues.status, "OPEN"),
            ),
          );

        // 5. บันทึก issue สำหรับรายการสินค้าที่ค้างส่งแต่ยังไม่เคยมี issue record
        const existingIssueItemIds = new Set(
          existingIssues.map((issue) => issue.purchaseOrderItemId),
        );

        for (const item of poItems) {
          if (
            item.quantity > item.receivedQuantity &&
            !existingIssueItemIds.has(item.id)
          ) {
            await tx.insert(purchaseOrderIssues).values({
              purchaseOrderId,
              purchaseOrderItemId: item.id,
              inventoryItemId: item.inventoryItemId,
              orderedQuantity: item.quantity,
              receivedQuantity: item.receivedQuantity,
              shortageQuantity: item.quantity - item.receivedQuantity,
              status: "RESOLVED",
              resolutionType,
              resolutionNote,
              resolvedAt: now,
              resolvedBy: staffRow.id,
            });
          }
        }

        // 6. เปลี่ยนสถานะ PO จาก PARTIALLY_RECEIVED เป็น RECEIVED (ปิด PO สมบูรณ์)
        // ไม่มีการเพิ่มสต็อกสินค้าลงใน inventoryItems และไม่มีการบันทึกรายการ expense เพิ่มเติม
        await tx
          .update(purchaseOrders)
          .set({
            status: "RECEIVED",
          })
          .where(eq(purchaseOrders.id, purchaseOrderId));

        // 7. บันทึก Audit Log ลงใน purchase_order_logs
        const resolutionLabel =
          RESOLUTION_TYPE_CONFIG[resolutionType]?.shortLabel ?? resolutionType;
        const auditLogNote = `ยุติปัญหาของขาด (${resolutionLabel}): ${resolutionNote}`;

        await insertPurchaseOrderLog(tx, {
          purchaseOrderId,
          staffId: staffRow.id,
          event: "STATUS_CHANGED",
          fromStatus: "PARTIALLY_RECEIVED",
          toStatus: "RECEIVED",
          note: auditLogNote,
        });

        return {
          success: true,
          data: { status: "RECEIVED" },
        };
      },
    );

    if (transactionResult.success) {
      revalidatePath("/inventories");
      revalidatePath(`/inventories/purchase-orders/${purchaseOrderId}`);
    }

    return transactionResult;
  } catch (error) {
    console.error("resolvePurchaseOrderDiscrepancy error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกการยุติปัญหาของขาด",
    };
  }
}

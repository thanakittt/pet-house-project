"use server";

import { db } from "@/db";
import { inventoryItems, purchaseOrderItems, purchaseOrders } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { and, eq, isNull } from "drizzle-orm";
import type { ReceivePreviewRow } from "../types/purchase-order";

/**
 * getReceivePreview — ดึงข้อมูล preview สำหรับ dialog ยืนยันการรับของ
 * แสดงชื่อสินค้า, stock เดิม, จำนวนที่สั่ง, และผลลัพธ์ (stock เดิม + จำนวนสั่ง)
 * @param orderId — UUID ของ purchase_order
 */
export async function getReceivePreview(
  orderId: string
): Promise<ActionResponse<ReceivePreviewRow[]>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลนี้",
      };
    }

    // ตรวจสอบว่า PO มีอยู่และไม่ถูกลบ
    const [order] = await db
      .select({ id: purchaseOrders.id })
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, orderId), isNull(purchaseOrders.deletedAt)));

    if (!order) {
      return {
        success: false,
        error: "ไม่พบใบสั่งซื้อที่ระบุ",
      };
    }

    // ดึง items ของ PO พร้อม JOIN inventory_items เพื่อได้ชื่อและ stock เดิม
    const rows = await db
      .select({
        purchaseOrderItemId: purchaseOrderItems.id,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        inventoryItemName: inventoryItems.name,
        currentStock: inventoryItems.quantity,
        orderedQuantity: purchaseOrderItems.quantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        unitCost: purchaseOrderItems.unitCost,
      })
      .from(purchaseOrderItems)
      .innerJoin(
        inventoryItems,
        and(
          eq(purchaseOrderItems.inventoryItemId, inventoryItems.id),
          isNull(inventoryItems.deletedAt),
        ),
      )
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, orderId),
          isNull(purchaseOrderItems.deletedAt),
        ),
      );

    if (rows.length === 0) {
      return {
        success: false,
        error: "ใบสั่งซื้อนี้ไม่มีรายการสินค้า",
      };
    }

    const data: ReceivePreviewRow[] = rows.map((row) => {
      const remainingQuantity = Math.max(
        0,
        row.orderedQuantity - row.receivedQuantity,
      );
      return {
        purchaseOrderItemId: row.purchaseOrderItemId,
        inventoryItemId: row.inventoryItemId,
        inventoryItemName: row.inventoryItemName,
        currentStock: row.currentStock,
        orderedQuantity: row.orderedQuantity,
        receivedQuantity: row.receivedQuantity,
        remainingQuantity,
        unitCost: parseFloat(row.unitCost),
        resultStock: row.currentStock + remainingQuantity,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("getReceivePreview error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลตัวอย่างการรับของ",
    };
  }
}

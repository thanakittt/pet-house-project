"use server";

import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  UpdatePurchaseOrderVendorSnapshotInput,
  updatePurchaseOrderVendorSnapshotSchema,
} from "../types/purchase-order";

/**
 * updatePurchaseOrderVendorSnapshot — บันทึกข้อมูล Vendor Snapshot ลงบนใบสั่งซื้อเฉพาะใบ
 * รองรับการเรียกทั้งแบบ object { purchaseOrderId, ... } หรือแยกพารามิเตอร์ (purchaseOrderId, snapshot)
 */
export async function updatePurchaseOrderVendorSnapshot(
  inputOrId: string | UpdatePurchaseOrderVendorSnapshotInput,
  maybeSnapshot?: Omit<UpdatePurchaseOrderVendorSnapshotInput, "purchaseOrderId">,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการแก้ไขข้อมูลใบสั่งซื้อ",
      };
    }

    const payload =
      typeof inputOrId === "string"
        ? { purchaseOrderId: inputOrId, ...(maybeSnapshot || {}) }
        : inputOrId;

    const parsed = updatePurchaseOrderVendorSnapshotSchema.safeParse(payload);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message;
      return {
        success: false,
        error: firstError || "ข้อมูลผู้จำหน่ายไม่ถูกต้อง",
      };
    }

    const { purchaseOrderId, vendorName, vendorAddress, vendorPhone, vendorTaxId } =
      parsed.data;

    // ตรวจสอบความมีอยู่และสถานะของใบสั่งซื้อ
    const [order] = await db
      .select({ id: purchaseOrders.id, status: purchaseOrders.status })
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
        error: "ไม่พบใบสั่งซื้อที่ระบุ หรือถูกลบไปแล้ว",
      };
    }

    if (order.status === "CANCELLED") {
      return {
        success: false,
        error: "ไม่สามารถแก้ไขข้อมูลใบสั่งซื้อที่ถูกยกเลิกแล้ว",
      };
    }

    // อัปเดตเฉพาะคอลัมน์ Snapshot ของ PO ใบนี้ ไม่กระทบตาราง vendors หลัก
    await db
      .update(purchaseOrders)
      .set({
        vendorName,
        vendorAddress: vendorAddress?.trim() || null,
        vendorPhone: vendorPhone?.trim() || null,
        vendorTaxId: vendorTaxId?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, purchaseOrderId));

    // Revalidate paths ที่เกี่ยวข้อง
    revalidatePath("/back-office/inventories");
    revalidatePath(`/back-office/inventories/purchase-orders/${purchaseOrderId}`);
    revalidatePath(`/back-office/inventories/purchase-orders/${purchaseOrderId}/print`);
    revalidatePath("/inventories");
    revalidatePath(`/inventories/purchase-orders/${purchaseOrderId}`);
    revalidatePath(`/inventories/purchase-orders/${purchaseOrderId}/print`);

    return { success: true, data: null };
  } catch (error) {
    console.error("updatePurchaseOrderVendorSnapshot error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้จำหน่ายของใบสั่งซื้อ",
    };
  }
}

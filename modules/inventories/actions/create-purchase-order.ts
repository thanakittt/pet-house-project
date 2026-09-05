"use server";

import { db } from "@/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  inventoryItems,
  vendors,
} from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  PurchaseOrderForm,
  purchaseOrderFormSchema,
} from "../types/purchase-order";
import { staffs } from "@/db/schema/staff";

/**
 * createPurchaseOrder — สร้างใบสั่งซื้อใหม่
 * - ตรวจสอบ session ก่อน
 * - Validate ข้อมูล input ผ่าน purchaseOrderFormSchema
 * - ตรวจสอบว่า vendor มีอยู่จริง, ยังไม่ถูกลบ, และเปิดใช้งานอยู่
 * - ตรวจสอบว่า inventoryItem ทุกตัวมีอยู่จริง
 * - Insert purchaseOrders (พร้อม Vendor Snapshot) + purchaseOrderItems ใน transaction เดียวกัน
 */
export async function createPurchaseOrder(
  data: PurchaseOrderForm,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการสร้างใบสั่งซื้อ",
      };
    }

    // ── Validate: ตรวจสอบข้อมูลด้วย Zod Schema ──
    const parseResult = purchaseOrderFormSchema.safeParse(data);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues?.[0]?.message;
      return {
        success: false,
        error: firstError || "ข้อมูลใบสั่งซื้อไม่ถูกต้อง",
      };
    }

    const validData = parseResult.data;

    // ── ตรวจสอบข้อมูลผู้จำหน่าย (Vendor): ต้องมีอยู่จริง, active, และไม่ถูกลบ ──
    const [vendorRow] = await db
      .select({
        id: vendors.id,
        name: vendors.name,
      })
      .from(vendors)
      .where(
        and(
          eq(vendors.id, validData.vendorId),
          isNull(vendors.deletedAt),
          eq(vendors.isActive, true),
        ),
      );

    if (!vendorRow) {
      return {
        success: false,
        error: "ไม่พบข้อมูลผู้จำหน่าย หรือผู้จำหน่ายถูกระงับการใช้งาน",
      };
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
    const itemIds = validData.items.map((i) => i.inventoryItemId);
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
          isNull(inventoryItems.deletedAt),
        ),
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
      // 1. Insert ใบสั่งซื้อหลักพร้อม Vendor Snapshot
      const [newOrder] = await tx
        .insert(purchaseOrders)
        .values({
          orderDate: validData.orderDate,
          status: "DRAFT", // เริ่มต้นเป็น DRAFT เสมอ
          staffId: staffRow.id,
          vendorId: validData.vendorId,
          vendorName: validData.vendorName,
          vendorAddress: validData.vendorAddress || null,
          vendorPhone: validData.vendorPhone || null,
          vendorTaxId: validData.vendorTaxId || null,
        })
        .returning({ id: purchaseOrders.id });

      // 2. Insert รายการสินค้าทั้งหมดในใบสั่งซื้อนี้
      await tx.insert(purchaseOrderItems).values(
        validData.items.map((item) => ({
          purchaseOrderId: newOrder.id,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCost: String(item.unitCost), // numeric column ต้องส่งเป็น string
        })),
      );

      return newOrder;
    });

    // revalidate หน้า inventory เพื่อให้ list อัปเดต
    revalidatePath("/inventories");
    revalidatePath("/back-office/inventories");

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

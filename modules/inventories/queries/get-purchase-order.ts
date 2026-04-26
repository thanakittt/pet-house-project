import { db } from "@/db";
import { ActionResponse } from "@/types/action";
import { PurchaseOrderDetail } from "../types/purchase-order";
import { purchaseOrders } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { and, eq, isNull } from "drizzle-orm";

/**
 * getPurchaseOrder — ดึงข้อมูลใบสั่งซื้อ 1 ใบ พร้อม items ทั้งหมด
 * ใช้สำหรับหน้า detail / edit
 * @param id — UUID ของ purchase_order
 */
export async function getPurchaseOrder(
  id: string
): Promise<ActionResponse<PurchaseOrderDetail>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลใบสั่งซื้อ",
      };
    }

    // ดึง PO พร้อม staff + items + ชื่อสินค้าแต่ละรายการ
    const row = await db.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        isNull(purchaseOrders.deletedAt)
      ),
      with: {
        // JOIN staff เพื่อดึง nickname
        staff: {
          columns: {
            nickname: true,
          },
        },
        // JOIN items พร้อม inventory item name
        items: {
          with: {
            inventoryItem: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!row) {
      return {
        success: false,
        error: "ไม่พบใบสั่งซื้อที่ระบุ หรือถูกลบไปแล้ว",
      };
    }

    const { staff, items, ...order } = row;

    // แปลงข้อมูลให้ตรงกับ PurchaseOrderDetail type
    const data: PurchaseOrderDetail = {
      ...order,
      staffNickname: staff?.nickname ?? "ไม่ระบุพนักงาน",
      items: items.map(({ inventoryItem, ...item }) => ({
        ...item,
        inventoryItemName: inventoryItem?.name ?? "ไม่ระบุสินค้า",
      })),
    };

    return { success: true, data };
  } catch (error) {
    console.error("getPurchaseOrder error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ",
    };
  }
}

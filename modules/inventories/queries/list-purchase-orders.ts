import { db } from "@/db";
import { ActionResponse } from "@/types/action";
import { PurchaseOrderSummary } from "../types/purchase-order";
import { purchaseOrders, purchaseOrderItems } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { desc, eq, isNull, sum, sql } from "drizzle-orm";

/**
 * listPurchaseOrders — ดึงรายการใบสั่งซื้อทั้งหมด
 * เรียงจากใหม่สุดก่อน พร้อมชื่อพนักงานและยอดรวม
 */
export async function listPurchaseOrders(): Promise<
  ActionResponse<PurchaseOrderSummary[]>
> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูข้อมูลใบสั่งซื้อ",
      };
    }

    // ดึง PO ทั้งหมดพร้อม staff nickname (ผ่าน Relational Query)
    const rows = await db.query.purchaseOrders.findMany({
      where: isNull(purchaseOrders.deletedAt),
      orderBy: desc(purchaseOrders.createdAt),
      with: {
        // JOIN staff เพื่อดึง nickname
        staff: {
          columns: {
            nickname: true,
          },
        },
      },
    });

    // คำนวณยอดรวมแยกต่างหากด้วย SQL aggregation
    const totalsRaw = await db
      .select({
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        // SUM(quantity * unit_cost) — ต้อง cast เป็น numeric ก่อน
        totalAmount: sql<string>`COALESCE(SUM(${purchaseOrderItems.quantity}::numeric * ${purchaseOrderItems.unitCost}), 0)`,
      })
      .from(purchaseOrderItems)
      .where(isNull(purchaseOrderItems.deletedAt))
      .groupBy(purchaseOrderItems.purchaseOrderId);

    // สร้าง map id → totalAmount เพื่อ lookup O(1)
    const totalsMap = new Map(
      totalsRaw.map((t) => [t.purchaseOrderId, t.totalAmount]),
    );

    // รวมข้อมูลทั้งหมดเป็น PurchaseOrderSummary[]
    const data: PurchaseOrderSummary[] = rows.map(({ staff, ...order }) => ({
      ...order,
      staffNickname: staff?.nickname ?? "ไม่ระบุพนักงาน",
      totalAmount: totalsMap.get(order.id) ?? "0",
    }));

    return { success: true, data };
  } catch (error) {
    console.error("listPurchaseOrders error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลใบสั่งซื้อ",
    };
  }
}

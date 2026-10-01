import { db } from "@/db";
import { purchaseOrderLogs } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { eq } from "drizzle-orm";

export interface PurchaseOrderLogEntry {
  id: string;
  purchaseOrderId: string;
  staffId: string;
  staffNickname: string;
  event: "CREATED" | "STATUS_CHANGED" | "ITEMS_UPDATED" | "VENDOR_UPDATED" | "DELETED";
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: Date;
}

/**
 * getPurchaseOrderLogs — ดึง logs ของ PO ใบหนึ่ง เรียงตาม createdAt DESC
 * JOIN กับ staffs เพื่อแสดงชื่อพนักงาน
 */
export async function getPurchaseOrderLogs(
  purchaseOrderId: string,
): Promise<ActionResponse<PurchaseOrderLogEntry[]>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตในการดูประวัติใบสั่งซื้อ",
      };
    }

    const rows = await db.query.purchaseOrderLogs.findMany({
      where: eq(purchaseOrderLogs.purchaseOrderId, purchaseOrderId),
      with: {
        staff: {
          columns: {
            nickname: true,
          },
        },
      },
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });

    const data: PurchaseOrderLogEntry[] = rows.map((row) => ({
      id: row.id,
      purchaseOrderId: row.purchaseOrderId,
      staffId: row.staffId,
      staffNickname: row.staff?.nickname ?? "ไม่ระบุพนักงาน",
      event: row.event,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      note: row.note,
      createdAt: row.createdAt,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("getPurchaseOrderLogs error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงประวัติใบสั่งซื้อ",
    };
  }
}

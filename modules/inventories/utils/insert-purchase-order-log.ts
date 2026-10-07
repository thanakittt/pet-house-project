import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "@/db/schema";
import { purchaseOrderLogs } from "@/db/schema";
import type { PurchaseOrderStatus } from "../constants/purchase-order-status";

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type PurchaseOrderLogEvent =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ITEMS_UPDATED"
  | "VENDOR_UPDATED"
  | "DELETED";

/**
 * สร้าง note อัตโนมัติตาม event type
 */
function buildNote(
  event: PurchaseOrderLogEvent,
  fromStatus?: PurchaseOrderStatus,
  toStatus?: PurchaseOrderStatus,
): string {
  switch (event) {
    case "CREATED":
      return "สร้างใบสั่งซื้อ";
    case "STATUS_CHANGED":
      return `เปลี่ยนสถานะจาก ${fromStatus} เป็น ${toStatus}`;
    case "ITEMS_UPDATED":
      return "แก้ไขรายการสินค้า";
    case "VENDOR_UPDATED":
      return "แก้ไขข้อมูลผู้จำหน่าย";
    case "DELETED":
      return "ลบใบสั่งซื้อ";
  }
}

interface InsertPurchaseOrderLogParams {
  purchaseOrderId: string;
  staffId: string;
  event: PurchaseOrderLogEvent;
  fromStatus?: PurchaseOrderStatus;
  toStatus?: PurchaseOrderStatus;
  note?: string;
}

/**
 * insertPurchaseOrderLog — insert log เข้าไปใน transaction
 * เรียกภายใน tx เท่านั้น เพื่อให้ atomic กับ action หลัก
 */
export async function insertPurchaseOrderLog(
  tx: Tx,
  params: InsertPurchaseOrderLogParams,
): Promise<void> {
  const { purchaseOrderId, staffId, event, fromStatus, toStatus, note } =
    params;

  await tx.insert(purchaseOrderLogs).values({
    purchaseOrderId,
    staffId,
    event,
    fromStatus: fromStatus ?? null,
    toStatus: toStatus ?? null,
    note: note ?? buildNote(event, fromStatus, toStatus),
  });
}

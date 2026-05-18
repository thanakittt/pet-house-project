// ===================================================
// purchase-order-status.ts
// คำนิยามสถานะใบสั่งซื้อ — ตรงกับ DB enum purchaseOrderStatusEnum
// ===================================================

/** สถานะทั้งหมดที่ DB รองรับ */
export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";

/**
 * ค่า config สำหรับแต่ละสถานะ
 * - title: ชื่อภาษาไทยที่แสดงใน UI
 * - group: กลุ่มที่ใช้จัดหมวด dropdown
 * - color: Tailwind class สำหรับปุ่มสถานะ
 * - dot: Tailwind class สำหรับวงกลมแสดงสถานะ
 * - next: สถานะถัดไปเมื่อกด Quick-advance (null = terminal)
 */
export const PURCHASE_ORDER_STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  {
    title: string;
    group: "Not Started" | "Active" | "Closed";
    color: string;
    dot: string;
    next: PurchaseOrderStatus | null;
  }
> = {
  DRAFT: {
    title: "ร่าง",
    group: "Not Started",
    color: "bg-gray-50 text-gray-600 border-gray-400 hover:bg-gray-100",
    dot: "border-slate-400 border-dashed",
    next: "ORDERED",
  },
  ORDERED: {
    title: "สั่งซื้อแล้ว",
    group: "Active",
    color: "bg-amber-50 text-amber-600 border-amber-400 hover:bg-amber-100",
    dot: "bg-amber-400 border-amber-400",
    next: "RECEIVED",
  },
  RECEIVED: {
    title: "รับของแล้ว",
    group: "Closed",
    color: "bg-green-50 text-green-600 border-green-400 hover:bg-green-100",
    dot: "bg-green-400 border-green-400",
    next: null, // terminal state
  },
  CANCELLED: {
    title: "ยกเลิก",
    group: "Closed",
    color: "bg-rose-50 text-rose-600 border-rose-400 hover:bg-rose-100",
    dot: "bg-rose-400 border-rose-400",
    next: null, // terminal state
  },
} as const;

/** รายการ key ทั้งหมดของ config (ใช้ type-safe iteration) */
export const PURCHASE_ORDER_STATUS_KEYS = Object.keys(
  PURCHASE_ORDER_STATUS_CONFIG
) as PurchaseOrderStatus[];

/**
 * ตรวจสอบว่า status ที่รับมาเป็น PurchaseOrderStatus ที่ถูกต้องหรือไม่
 * ใช้ใน server action สำหรับ validate input
 */
export function isValidPurchaseOrderStatus(
  value: unknown
): value is PurchaseOrderStatus {
  return (
    typeof value === "string" &&
    Object.keys(PURCHASE_ORDER_STATUS_CONFIG).includes(value)
  );
}

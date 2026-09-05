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
    color: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
    dot: "border-muted-foreground border-dashed",
    next: "ORDERED",
  },
  ORDERED: {
    title: "สั่งซื้อแล้ว",
    group: "Active",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/50 hover:bg-amber-500/20 dark:text-amber-300",
    dot: "bg-amber-400 border-amber-400",
    next: "RECEIVED",
  },
  RECEIVED: {
    title: "รับของแล้ว",
    group: "Closed",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/50 hover:bg-emerald-500/20 dark:text-emerald-300",
    dot: "bg-emerald-400 border-emerald-400",
    next: null, // terminal state
  },
  CANCELLED: {
    title: "ยกเลิก",
    group: "Closed",
    color: "bg-destructive/10 text-destructive border-destructive/50 hover:bg-destructive/20",
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

/** สถานะที่อนุญาตให้พิมพ์ใบสั่งซื้อ (A4) */
export const PRINTABLE_PURCHASE_ORDER_STATUSES: readonly PurchaseOrderStatus[] = [
  "ORDERED",
  "RECEIVED",
] as const;

/**
 * ตรวจสอบว่า status สามารถพิมพ์ใบสั่งซื้อได้หรือไม่
 */
export function isPrintablePurchaseOrderStatus(
  status: unknown
): boolean {
  return (
    typeof status === "string" &&
    PRINTABLE_PURCHASE_ORDER_STATUSES.includes(status as PurchaseOrderStatus)
  );
}


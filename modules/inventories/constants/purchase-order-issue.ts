// ===================================================
// purchase-order-issue.ts
// นิยามประเภทการยุติปัญหาของขาดในใบสั่งซื้อ (ตรงกับ DB enum purchase_order_issue_resolution_type)
// ===================================================

export type PurchaseOrderIssueResolutionType =
  | "ALL_ITEMS_RECEIVED"
  | "DISCOUNT_NEXT_ORDER"
  | "REFUNDED"
  | "WAIVED";

export type PurchaseOrderManualResolutionType =
  | "DISCOUNT_NEXT_ORDER"
  | "REFUNDED"
  | "WAIVED";

export const PURCHASE_ORDER_MANUAL_RESOLUTION_TYPES: readonly PurchaseOrderManualResolutionType[] =
  ["DISCOUNT_NEXT_ORDER", "REFUNDED", "WAIVED"] as const;

export interface ResolutionTypeConfig {
  value: PurchaseOrderManualResolutionType;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
}

export const RESOLUTION_TYPE_CONFIG: Record<
  PurchaseOrderManualResolutionType,
  ResolutionTypeConfig
> = {
  DISCOUNT_NEXT_ORDER: {
    value: "DISCOUNT_NEXT_ORDER",
    label: "ส่วนลดในคำสั่งซื้อถัดไป (Discount on Next Order)",
    shortLabel: "ส่วนลดคำสั่งซื้อถัดไป",
    description: "ผู้จำหน่ายตกลงชดเชยโดยมอบส่วนลดในรอบการสั่งซื้อครั้งต่อไป",
    badgeClass:
      "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  REFUNDED: {
    value: "REFUNDED",
    label: "ขอคืนเงิน (Refunded)",
    shortLabel: "คืนเงิน",
    description: "ผู้จำหน่ายดำเนินการคืนเงินส่วนต่างตามมูลค่าสินค้าที่ค้างส่ง",
    badgeClass:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  WAIVED: {
    value: "WAIVED",
    label: "ยินยอมยกเลิกส่วนที่ขาด / ไม่รับเงินคืน (Waived)",
    shortLabel: "ยินยอมยกเลิกส่วนที่ขาด",
    description:
      "ยินยอมยกเลิกรายการสินค้าที่ขาดโดยตกลงร่วมกันและไม่เรียกเก็บค่าชดเชย",
    badgeClass:
      "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  },
};

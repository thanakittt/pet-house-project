import { InferSelectModel } from "drizzle-orm";
import { purchaseOrderIssues, purchaseOrderItems, purchaseOrders } from "@/db/schema";
import { z } from "zod";

// ===================================================
// Receive Preview — ใช้ใน ReceiveConfirmDialog
// ===================================================

/**
 * ReceivePreviewRow — ข้อมูล 1 แถวในตาราง dialog ยืนยันการรับของ
 * แสดงก่อน commit สถานะ RECEIVED
 */
export interface ReceivePreviewRow {
  /** UUID ของรายการสินค้าใน PO (purchase_order_items.id) */
  purchaseOrderItemId: string;
  /** UUID ของสินค้าในคลัง */
  inventoryItemId: string;
  /** ชื่อสินค้า */
  inventoryItemName: string;
  /** จำนวน stock ปัจจุบัน (ก่อนรับของ) */
  currentStock: number;
  /** จำนวนที่สั่งซื้อใน PO */
  orderedQuantity: number;
  /** จำนวนที่รับแล้วสะสม */
  receivedQuantity: number;
  /** จำนวนที่ค้างส่ง (orderedQuantity - receivedQuantity) */
  remainingQuantity: number;
  /** ราคาต่อหน่วย (บาท) */
  unitCost: number;
  /** ผลลัพธ์: currentStock + remainingQuantity */
  resultStock: number;
}

// ===================================================
// DB Types — อนุมานจาก Drizzle schema โดยตรง
// ===================================================

/** Type ตรงกับ row ใน purchase_orders table */
export type DbPurchaseOrder = InferSelectModel<typeof purchaseOrders>;

/** Type ตรงกับ row ใน purchase_order_items table */
export type DbPurchaseOrderItem = InferSelectModel<typeof purchaseOrderItems>;

/** Type ตรงกับ row ใน purchase_order_issues table */
export type DbPurchaseOrderIssue = InferSelectModel<typeof purchaseOrderIssues>;

// ===================================================
// Application Types — ใช้ในหน้า UI / component
// ===================================================

/**
 * PurchaseOrderSummary — ใช้แสดงในตาราง List
 * รวม staffNickname ที่ JOIN มาจาก staffs table
 * และ totalAmount ที่คำนวณจาก SUM(quantity * unit_cost)
 */
export interface PurchaseOrderSummary extends DbPurchaseOrder {
  /** ชื่อเล่นของพนักงานที่สร้างใบสั่งซื้อ */
  staffNickname: string;
  /** ยอดรวมทั้งหมดของใบสั่งซื้อ (string เพราะ numeric จาก DB) */
  totalAmount: string;
}

/**
 * PurchaseOrderItemDetail — รายการสินค้าภายในใบสั่งซื้อ
 * รวม inventoryItemName ที่ JOIN มาจาก inventory_items table
 */
export interface PurchaseOrderItemDetail extends DbPurchaseOrderItem {
  /** ชื่อสินค้าจาก inventory_items */
  inventoryItemName: string;
}

/**
 * PurchaseOrderIssueDetail — รายการสินค้าที่ค้างส่ง/ปัญหาในใบสั่งซื้อ
 * รวม inventoryItemName ที่ JOIN มาจาก inventory_items table
 */
export interface PurchaseOrderIssueDetail extends DbPurchaseOrderIssue {
  /** ชื่อสินค้าจาก inventory_items */
  inventoryItemName: string;
}

/**
 * PurchaseOrderDetail — ใช้ใน detail/edit page
 * รวม items ทั้งหมดของใบสั่งซื้อ
 */
export interface PurchaseOrderDetail extends DbPurchaseOrder {
  staffNickname: string;
  items: PurchaseOrderItemDetail[];
  issues?: PurchaseOrderIssueDetail[];
}

// ===================================================
// Form Types & Schemas — ใช้รับข้อมูลจาก UI ก่อนส่ง action
// ===================================================

export const purchaseOrderItemFormSchema = z.object({
  /** UUID ของสินค้าจาก inventory_items */
  inventoryItemId: z.string().uuid("รหัสสินค้าไม่ถูกต้อง"),
  /** ชื่อสินค้า (แสดงใน UI เท่านั้น) */
  inventoryItemName: z.string().min(1, "ชื่อสินค้าต้องไม่ว่าง"),
  /** จำนวนที่สั่งซื้อ */
  quantity: z
    .number({ message: "จำนวนสินค้าต้องเป็นตัวเลข" })
    .int("จำนวนสินค้าต้องเป็นจำนวนเต็ม")
    .min(1, "จำนวนสินค้าต้องมากกว่า 0"),
  /** ราคาต่อหน่วย (บาท) */
  unitCost: z
    .number({ message: "ราคาต่อหน่วยต้องเป็นตัวเลข" })
    .min(0, "ราคาต่อหน่วยต้องไม่ติดลบ"),
});

export const purchaseOrderFormSchema = z.object({
  /** วันที่สั่งซื้อ รูปแบบ YYYY-MM-DD */
  orderDate: z.string().min(1, "กรุณาระบุวันที่สั่งซื้อ"),
  /** UUID ของผู้จำหน่ายจากตาราง vendors */
  vendorId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกผู้จำหน่าย")
    .uuid("รหัสผู้จำหน่ายไม่ถูกต้อง"),
  /** Snapshot: ชื่อผู้จำหน่าย ณ เวลาสั่งซื้อ */
  vendorName: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อผู้จำหน่าย")
    .max(150, "ชื่อผู้จำหน่ายต้องไม่เกิน 150 ตัวอักษร"),
  /** Snapshot: ที่อยู่ผู้จำหน่าย */
  vendorAddress: z
    .string()
    .trim()
    .max(500, "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
  /** Snapshot: เบอร์โทรผู้จำหน่าย */
  vendorPhone: z
    .string()
    .trim()
    .max(50, "เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร")
    .optional()
    .nullable(),
  /** Snapshot: เลขประจำตัวผู้เสียภาษี */
  vendorTaxId: z
    .string()
    .trim()
    .max(20, "เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร")
    .optional()
    .nullable(),
  /** รายการสินค้าที่สั่งซื้อ */
  items: z
    .array(purchaseOrderItemFormSchema)
    .min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

/**
 * PurchaseOrderItemForm — ข้อมูล 1 รายการสินค้าในฟอร์ม
 */
export type PurchaseOrderItemForm = z.infer<typeof purchaseOrderItemFormSchema>;

/**
 * PurchaseOrderForm — ข้อมูลทั้งหมดของฟอร์มสร้างใบสั่งซื้อ
 */
export type PurchaseOrderForm = z.infer<typeof purchaseOrderFormSchema>;

export const updatePurchaseOrderVendorSnapshotSchema = z.object({
  purchaseOrderId: z.string().uuid("รหัสใบสั่งซื้อไม่ถูกต้อง"),
  vendorName: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อผู้จำหน่าย")
    .max(150, "ชื่อผู้จำหน่ายต้องไม่เกิน 150 ตัวอักษร"),
  vendorAddress: z
    .string()
    .trim()
    .max(500, "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
  vendorPhone: z
    .string()
    .trim()
    .max(50, "เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร")
    .optional()
    .nullable(),
  vendorTaxId: z
    .string()
    .trim()
    .max(20, "เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร")
    .optional()
    .nullable(),
});

export type UpdatePurchaseOrderVendorSnapshotInput = z.infer<
  typeof updatePurchaseOrderVendorSnapshotSchema
>;

export const resolvePurchaseOrderDiscrepancySchema = z.object({
  purchaseOrderId: z.string().uuid("รหัสใบสั่งซื้อไม่ถูกต้อง"),
  resolutionType: z.enum(
    ["DISCOUNT_NEXT_ORDER", "REFUNDED", "WAIVED"],
    { message: "กรุณาเลือกรูปแบบการยุติปัญหาที่ถูกต้อง" },
  ),
  resolutionNote: z
    .string()
    .trim()
    .min(1, "กรุณาระบุบันทึกข้อตกลง / เหตุผลการยุติปัญหา")
    .max(1000, "บันทึกข้อตกลงต้องไม่เกิน 1,000 ตัวอักษร"),
});

export type ResolvePurchaseOrderDiscrepancyInput = z.infer<
  typeof resolvePurchaseOrderDiscrepancySchema
>;



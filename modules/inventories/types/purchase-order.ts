import { InferSelectModel } from "drizzle-orm";
import { purchaseOrderItems, purchaseOrders } from "@/db/schema";

// ===================================================
// DB Types — อนุมานจาก Drizzle schema โดยตรง
// ===================================================

/** Type ตรงกับ row ใน purchase_orders table */
export type DbPurchaseOrder = InferSelectModel<typeof purchaseOrders>;

/** Type ตรงกับ row ใน purchase_order_items table */
export type DbPurchaseOrderItem = InferSelectModel<typeof purchaseOrderItems>;

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
 * PurchaseOrderDetail — ใช้ใน detail/edit page
 * รวม items ทั้งหมดของใบสั่งซื้อ
 */
export interface PurchaseOrderDetail extends DbPurchaseOrder {
  staffNickname: string;
  items: PurchaseOrderItemDetail[];
}

// ===================================================
// Form Types — ใช้รับข้อมูลจาก UI ก่อนส่ง action
// ===================================================

/**
 * PurchaseOrderItemForm — ข้อมูล 1 รายการสินค้าในฟอร์ม
 */
export interface PurchaseOrderItemForm {
  /** UUID ของสินค้าจาก inventory_items */
  inventoryItemId: string;
  /** ชื่อสินค้า (แสดงใน UI เท่านั้น) */
  inventoryItemName: string;
  /** จำนวนที่สั่งซื้อ */
  quantity: number;
  /** ราคาต่อหน่วย (บาท) */
  unitCost: number;
}

/**
 * PurchaseOrderForm — ข้อมูลทั้งหมดของฟอร์มสร้างใบสั่งซื้อ
 */
export interface PurchaseOrderForm {
  /** วันที่สั่งซื้อ รูปแบบ YYYY-MM-DD */
  orderDate: string;
  /** รายการสินค้าที่สั่งซื้อ */
  items: PurchaseOrderItemForm[];
}

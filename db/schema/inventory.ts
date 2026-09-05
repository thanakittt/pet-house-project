import * as p from "drizzle-orm/pg-core";
import { timestamps } from "./column.helper";
import { purchaseOrderStatusEnum, unitTypeEnum } from "./enum";
import { staffs } from "./staff";
import { vendors } from "./vendor";
import { sql } from "drizzle-orm";

// ตาราง inventoryCategories: เก็บหมวดหมู่สินค้าคงคลัง เช่น ยา, แชมพู
// ไม่มี FK → ไม่ต้องใส่ index เพิ่ม
export const inventoryCategories = p
  .pgTable("inventory_categories", {
    id: p.uuid("id").defaultRandom().primaryKey(),
    name: p.text("name").notNull(),
    ...timestamps,
  })
  .enableRLS();

// ตาราง inventoryItems: เก็บข้อมูลสินค้าในคลัง
// index บน inventory_category_id เพื่อเร่ง filter สินค้าตามหมวดหมู่
export const inventoryItems = p
  .pgTable(
    "inventory_items",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      name: p.text("name").notNull(),
      quantity: p.smallint("quantity").notNull(),
      unit: unitTypeEnum("unit").notNull(),
      reorderLevel: p.smallint("reorder_level").notNull(),
      // FK ไปยัง inventory_categories (หมวดหมู่สินค้า)
      inventoryCategoryId: p.uuid("inventory_category_id").notNull(),
      ...timestamps,
    },
    (table) => [
      p
        .foreignKey({
          name: "inv_category_fk",
          columns: [table.inventoryCategoryId],
          foreignColumns: [inventoryCategories.id],
        })
        .onDelete("restrict"),
      // index สำหรับ filter สินค้าตามหมวดหมู่ (หน้า inventory management)
      p.index("inventory_items_category_id_idx").on(table.inventoryCategoryId),
      // check constraint เพื่อให้แน่ใจว่า quantity และ reorderLevel ไม่ติดลบ
      p.check("inventory_items_quantity_check", sql`quantity >= 0`),
      p.check("inventory_items_reorder_level_check", sql`reorder_level >= 0`),
    ],
  )
  .enableRLS();

// ตาราง purchaseOrders: เก็บข้อมูลใบสั่งซื้อสินค้า
// index บน staff_id เพื่อเร่งการดูประวัติการสั่งซื้อของพนักงาน
export const purchaseOrders = p
  .pgTable(
    "purchase_orders",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      orderDate: p.date("order_date").notNull(),
      status: purchaseOrderStatusEnum("status").notNull(),
      // FK ไปยัง staffs (พนักงานที่สั่งซื้อ) — ใช้ text เพราะ staffs.id เป็น uuid
      staffId: p
        .uuid("staff_id")
        .notNull()
        .references(() => staffs.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง vendors (ผู้จำหน่าย) — Nullable เพื่อรองรับข้อมูล PO เดิม
      vendorId: p
        .uuid("vendor_id")
        .references(() => vendors.id, {
          onDelete: "restrict",
        }),
      // Snapshot ข้อมูลผู้จำหน่าย ณ เวลาที่ออกใบสั่งซื้อ
      vendorName: p.text("vendor_name"),
      vendorAddress: p.text("vendor_address"),
      vendorPhone: p.text("vendor_phone"),
      vendorTaxId: p.text("vendor_tax_id"),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูประวัติการสั่งซื้อของพนักงาน
      p.index("purchase_orders_staff_id_idx").on(table.staffId),
      // index สำหรับค้นหาใบสั่งซื้อตามผู้จำหน่าย
      p.index("purchase_orders_vendor_id_idx").on(table.vendorId),
    ],
  )
  .enableRLS();

// ตาราง purchaseOrderItems: เก็บรายการสินค้าแต่ละตัวในใบสั่งซื้อ
// index บน purchase_order_id และ inventory_item_id เพื่อเร่ง JOIN ทั้งสองทิศทาง
export const purchaseOrderItems = p
  .pgTable(
    "purchase_order_items",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      quantity: p.smallint("quantity").notNull(),
      unitCost: p.numeric("unit_cost", { precision: 8, scale: 2 }).notNull(),
      // FK ไปยัง purchaseOrders (ใบสั่งซื้อ)
      purchaseOrderId: p
        .uuid("purchase_order_id")
        .notNull()
        .references(() => purchaseOrders.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง inventoryItems (สินค้าที่สั่งซื้อ)
      inventoryItemId: p
        .uuid("inventory_item_id")
        .notNull()
        .references(() => inventoryItems.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดู items ทั้งหมดของใบสั่งซื้อ
      p.index("purchase_order_items_order_id_idx").on(table.purchaseOrderId),
      // index สำหรับดูประวัติสั่งซื้อแต่ละสินค้า
      p
        .index("purchase_order_items_inventory_id_idx")
        .on(table.inventoryItemId),

      // check constraint เพื่อป้องกัน quantity ติดลบ
      p.check(
        "purchase_order_items_quantity_check",
        sql`${table.quantity} > 0`,
      ),
      // check constraint เพื่อป้องกัน unit_cost ติดลบ
      p.check(
        "purchase_order_items_unit_cost_check",
        sql`${table.unitCost} >= 0`,
      ),
    ],
  )
  .enableRLS();

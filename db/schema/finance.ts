import * as p from "drizzle-orm/pg-core";
import {
  paymentMethodTypeEnum,
  paymentStatusEnum,
  transactionTypeEnum,
  paymentTypeEnum,
} from "./enum";
import { appointments } from "./appointment";
import { timestamps } from "./column.helper";
import { purchaseOrders } from "./inventory";
import { sql } from "drizzle-orm";

// ตาราง payments: เก็บข้อมูลการชำระเงินของลูกค้าตามนัดหมาย
// index บน appointment_id เพื่อเร่งการดึงข้อมูลการชำระเงินของนัดหมาย
export const payments = p
  .pgTable(
    "payments",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      amount: p.numeric("amount", { precision: 8, scale: 2 }).notNull(),
      paymentMethod: paymentMethodTypeEnum("payment_method").notNull(),
      paymentDate: p.date("payment_date", { mode: "date"}).notNull(),
      status: paymentStatusEnum("status").notNull(),
      paymentType: paymentTypeEnum("payment_type").notNull().default("FULL_PAYMENT"),
      // FK ไปยัง appointments
      appointmentId: p
        .uuid("appointment_id")
        .notNull()
        .references(() => appointments.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูการชำระเงินของนัดหมาย (หน้า billing/invoice)
      p.index("payments_appointment_id_idx").on(table.appointmentId),
      // check constraint เพื่อป้องกัน amount < 0
      p.check("payments_amount_check", sql`${table.amount} >= 0`),
    ],
  )
  .enableRLS();

// ตาราง transactionCategories: เก็บหมวดหมู่ธุรกรรมทางการเงิน
// ไม่มี FK → ไม่ต้องใส่ index เพิ่ม
export const transactionCategories = p
  .pgTable("transaction_categories", {
    id: p.uuid("id").defaultRandom().primaryKey(),
    name: p.text("name").notNull(),
    type: transactionTypeEnum("type").notNull(),
    ...timestamps,
  })
  .enableRLS();

// ตาราง transactions: เก็บข้อมูลธุรกรรมทางการเงินทั้งรายรับและรายจ่าย
// index หลายตัวเพื่อรองรับรายงานการเงิน, filter ตาม category, วันที่ และแหล่งที่มา
export const transactions = p
  .pgTable(
    "transactions",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      amount: p.numeric("amount", { precision: 8, scale: 2 }).notNull(),
      transactionDate: p.date("transaction_date").notNull(),
      note: p.text("note"),
      // FK ไปยัง appointments (optional: ธุรกรรมอาจมาจากนัดหมาย)
      appointmentId: p
        .uuid("appointment_id")
        .references(() => appointments.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง purchase_orders (optional: ธุรกรรมอาจมาจากการสั่งซื้อ)
      purchaseOrderId: p
        .uuid("purchase_order_id")
        .references(() => purchaseOrders.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง transaction_categories (บังคับ)
      transactionCategoryId: p.uuid("transaction_category_id").notNull(),
      ...timestamps,
    },
    (table) => [
      p
        .foreignKey({
          name: "tx_category_fk",
          columns: [table.transactionCategoryId],
          foreignColumns: [transactionCategories.id],
        })
        .onDelete("restrict"),

      // partial UNIQUE index: บังคับให้ 1 นัดหมายมีได้ 1 transaction เท่านั้น
      // WHERE appointment_id IS NOT NULL เพื่อไม่ให้ NULL rows ชนกัน
      p
        .uniqueIndex("transactions_appointment_id_unique_idx")
        .on(table.appointmentId)
        .where(sql`${table.appointmentId} IS NOT NULL`),
      // partial UNIQUE index: บังคับให้ 1 ใบสั่งซื้อมีได้ 1 transaction เท่านั้น
      // WHERE purchase_order_id IS NOT NULL เพื่อไม่ให้ NULL rows ชนกัน
      p
        .uniqueIndex("transactions_purchase_order_id_unique_idx")
        .on(table.purchaseOrderId)
        .where(sql`${table.purchaseOrderId} IS NOT NULL`),
      // CHECK constraint: ป้องกันไม่ให้ทั้ง appointment_id และ purchase_order_id มีค่าพร้อมกัน
      // (source exclusivity) — transaction ต้องมาจากแหล่งเดียวเท่านั้น
      p.check(
        "transactions_source_exclusivity_check",
        sql`(${table.appointmentId} IS NULL) OR (${table.purchaseOrderId} IS NULL)`,
      ),
      // index สำหรับ filter ธุรกรรมตามหมวดหมู่ (รายงานการเงินแยกหมวด)
      p.index("transactions_category_id_idx").on(table.transactionCategoryId),
      // index สำหรับค้นหาตามวันที่ (รายงานรายวัน/รายเดือน)
      p.index("transactions_date_idx").on(table.transactionDate),
      // check constraint เพื่อป้องกัน amount < 0
      p.check("transactions_amount_check", sql`${table.amount} >= 0`),
    ],
  )
  .enableRLS();

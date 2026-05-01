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
      paymentDate: p.date("payment_date", { mode: "string" }).notNull(),
      status: paymentStatusEnum("status").notNull(),
      paymentType: paymentTypeEnum("payment_type")
        .notNull()
        .default("FULL_PAYMENT"),
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
      transactionDate: p.date("transaction_date", { mode: "string" }).notNull(),
      note: p.text("note"),
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
      // index สำหรับ filter ธุรกรรมตามหมวดหมู่ (รายงานการเงินแยกหมวด)
      p.index("transactions_category_id_idx").on(table.transactionCategoryId),
      // index สำหรับค้นหาตามวันที่ (รายงานรายวัน/รายเดือน)
      p.index("transactions_date_idx").on(table.transactionDate),
      // check constraint เพื่อป้องกัน amount < 0
      p.check("transactions_amount_check", sql`${table.amount} >= 0`),
    ],
  )
  .enableRLS();

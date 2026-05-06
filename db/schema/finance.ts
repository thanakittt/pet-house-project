import * as p from "drizzle-orm/pg-core";
import {
  paymentMethodTypeEnum,
  paymentStatusEnum,
  transactionTypeEnum,
  paymentTypeEnum,
  slipVerificationStatusEnum,
} from "./enum";
import { appointments } from "./appointment";
import { timestamps } from "./column.helper";
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

// ตารางนี้เก็บ "ทุกครั้งที่ลูกค้าอัปโหลดสลิปเพื่อตรวจ"
// แยกจาก payments เพราะสลิปอาจไม่ผ่านหรือ provider error ซึ่งยังไม่ควรสร้าง payment จริง
// เมื่อสลิป VERIFIED แล้ว paymentId จะชี้ไป payment มัดจำที่สร้างสำเร็จ
export const paymentSlipVerifications = p
  .pgTable(
    "payment_slip_verifications",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      appointmentId: p
        .uuid("appointment_id")
        .notNull()
        .references(() => appointments.id, {
          onDelete: "restrict",
        }),
      paymentId: p.uuid("payment_id").references(() => payments.id, {
        onDelete: "set null",
      }),
      provider: p.text("provider").notNull().default("THUNDER"),
      status: slipVerificationStatusEnum("status").notNull(),
      slipImageUrl: p.text("slip_image_url").notNull(),
      remark: p.text("remark"),
      // transRef เป็นเลขอ้างอิงจาก QR slip ใช้ค้นหาหรือ audit กรณีสลิปซ้ำได้เร็ว
      transRef: p.text("trans_ref"),
      amountInSlip: p.numeric("amount_in_slip", {
        precision: 8,
        scale: 2,
      }),
      amountInOrder: p.numeric("amount_in_order", {
        precision: 8,
        scale: 2,
      }),
      isAmountMatched: p.boolean("is_amount_matched"),
      isDuplicate: p.boolean("is_duplicate").notNull().default(false),
      // matchedAccount/rawSlip/providerResponse เก็บเป็น JSON เพราะ shape มาจาก provider และอาจเปลี่ยนได้
      matchedAccount: p.jsonb("matched_account"),
      rawSlip: p.jsonb("raw_slip"),
      providerResponse: p.jsonb("provider_response"),
      providerErrorCode: p.text("provider_error_code"),
      providerErrorMessage: p.text("provider_error_message"),
      ...timestamps,
    },
    (table) => [
      p
        .index("payment_slip_verifications_appointment_id_idx")
        .on(table.appointmentId),
      p
        .index("payment_slip_verifications_payment_id_idx")
        .on(table.paymentId),
      p.index("payment_slip_verifications_trans_ref_idx").on(table.transRef),
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

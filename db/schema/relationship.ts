// ===================================================
// relationship.ts — Drizzle Relations ทุก domain
// ===================================================
// ไฟล์นี้กำหนด "ความสัมพันธ์" ระหว่างตารางทั้งหมด
// เพื่อเปิดใช้งาน Drizzle Relational Query API (db.query.*)
// ซึ่งช่วยให้ดึงข้อมูล JOIN ได้โดยไม่ต้องเขียน SQL ด้วยตนเอง
// ===================================================

import { relations } from "drizzle-orm";

// --- Auth ---
import { users, sessions, accounts } from "./auth";

// --- Customer ---
import { customers, pets, petBreeds } from "./customer";

// --- Appointment ---
import {
  appointments,
  appointmentItems,
  healthReports,
  serviceImages,
} from "./appointment";

// --- Service ---
import { services, serviceVariants } from "./service";

// --- Finance ---
import {
  payments,
  paymentSlipVerifications,
  transactions,
  transactionCategories,
} from "./finance";

// --- Inventory ---
import {
  inventoryCategories,
  inventoryItems,
  purchaseOrders,
  purchaseOrderItems,
} from "./inventory";

// --- Store ---
import { reviews } from "./store";

// --- Staff ---
import { staffs } from "./staff";
import {
  businessDateOverrideHours,
  businessDateOverrides,
  businessRules,
  businessWeeklyHours,
} from "./business-rule";

// ===================================================
// 🔐 AUTH DOMAIN
// ===================================================

/**
 * users → sessions (1:N), accounts (1:N)
 * users → customers (1:0..1 optional — ลูกค้าอาจยังไม่มี account)
 * users → staffs (1:0..1 optional — staff ต้องมี account)
 */
export const userRelations = relations(users, ({ many, one }) => ({
  // user มีได้หลาย session (multi-device login)
  sessions: many(sessions),
  // user มีได้หลาย OAuth provider account
  accounts: many(accounts),
  // user อาจเป็น customer (optional)
  customer: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  }),
  // user อาจเป็น staff (optional)
  staff: one(staffs, {
    fields: [users.id],
    references: [staffs.userId],
  }),
}));

/**
 * sessions → users (N:1)
 * session แต่ละตัวเป็นของ user คนเดียว
 */
export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/**
 * accounts → users (N:1)
 * OAuth account แต่ละตัวเป็นของ user คนเดียว
 */
export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// ===================================================
// 👤 CUSTOMER DOMAIN
// ===================================================

/**
 * customers → users (N:1 optional)
 * customers → pets (1:N)
 * customers → appointments (1:N)
 * customers → reviews (1:N)
 */
export const customerRelations = relations(customers, ({ one, many }) => ({
  // customer อาจมี user account (optional)
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  // customer มีสัตว์เลี้ยงได้หลายตัว
  pets: many(pets),
  // customer มีประวัตินัดหมายหลายรายการ
  appointments: many(appointments),
  // customer เขียนรีวิวได้หลายรายการ
  reviews: many(reviews),
}));

/**
 * pets → customers (N:1)
 * pets → pet_breeds (N:1)
 * pets → appointment_items (1:N)
 */
export const petRelations = relations(pets, ({ one, many }) => ({
  // pet เป็นของ customer คนเดียว
  customer: one(customers, {
    fields: [pets.customerId],
    references: [customers.id],
  }),
  // pet มีสายพันธุ์หนึ่ง
  breed: one(petBreeds, {
    fields: [pets.petBreedId],
    references: [petBreeds.id],
  }),
  // pet ถูกนำมารับบริการได้หลายครั้ง
  appointmentItems: many(appointmentItems),
}));

/**
 * pet_breeds → pets (1:N)
 * สายพันธุ์หนึ่งมีสัตว์เลี้ยงได้หลายตัว
 */
export const petBreedRelations = relations(petBreeds, ({ many }) => ({
  pets: many(pets),
}));

// ===================================================
// 📅 APPOINTMENT DOMAIN
// ===================================================

/**
 * appointments → customers (N:1)
 * appointments → appointment_items (1:N)
 * appointments → payments (1:N) — 1 นัดหมายมีได้หลาย payment (เช่น มัดจำ + ส่วนที่เหลือ)
 * appointments → reviews (1:1) — 1 นัดหมายมี 1 รีวิว
 */
export const appointmentRelations = relations(
  appointments,
  ({ one, many }) => ({
    // นัดหมายสร้างโดย customer
    customer: one(customers, {
      fields: [appointments.customerId],
      references: [customers.id],
    }),
    // นัดหมายมีรายการบริการหลายรายการ
    items: many(appointmentItems),
    // นัดหมายมีการชำระเงินได้หลายรายการ (เช่น มัดจำ + ชำระส่วนที่เหลือ)
    payments: many(payments),
    // appointment หนึ่งอาจมีหลาย verification attempt เช่น upload ผิดรูปก่อน แล้วค่อย upload ถูก
    slipVerifications: many(paymentSlipVerifications),
    // นัดหมายมีรีวิว 1 รายการ (optional)
    review: one(reviews, {
      fields: [appointments.id],
      references: [reviews.appointmentId],
    }),
  }),
);

/**
 * appointment_items → appointments (N:1)
 * appointment_items → pets (N:1)
 * appointment_items → service_variants (N:1)
 * appointment_items → health_reports (1:N)
 * appointment_items → service_images (1:N)
 */
export const appointmentItemRelations = relations(
  appointmentItems,
  ({ one, many }) => ({
    // item เป็นส่วนหนึ่งของนัดหมาย
    appointment: one(appointments, {
      fields: [appointmentItems.appointmentId],
      references: [appointments.id],
    }),
    // item เป็นบริการให้กับ pet ตัวหนึ่ง
    pet: one(pets, {
      fields: [appointmentItems.petId],
      references: [pets.id],
    }),
    // item ใช้ service variant หนึ่ง (ตัวเลือกบริการ)
    serviceVariant: one(serviceVariants, {
      fields: [appointmentItems.serviceVariantId],
      references: [serviceVariants.id],
    }),
    // item มีรายงานสุขภาพได้หลายรายการ
    healthReports: many(healthReports),
    // item มีรูปภาพก่อน/หลังได้หลายรูป
    serviceImages: many(serviceImages),
  }),
);

/**
 * health_reports → appointment_items (N:1)
 * รายงานสุขภาพเป็นของ appointment_item หนึ่ง
 */
export const healthReportRelations = relations(healthReports, ({ one }) => ({
  appointmentItem: one(appointmentItems, {
    fields: [healthReports.appointmentItemId],
    references: [appointmentItems.id],
  }),
}));

/**
 * service_images → appointment_items (N:1)
 * รูปภาพบริการเป็นของ appointment_item หนึ่ง
 */
export const serviceImageRelations = relations(serviceImages, ({ one }) => ({
  appointmentItem: one(appointmentItems, {
    fields: [serviceImages.appointmentItemId],
    references: [appointmentItems.id],
  }),
}));

// ===================================================
// 🛠 SERVICE DOMAIN
// ===================================================

/**
 * services → service_variants (1:N)
 * บริการหลักมีตัวเลือกย่อยได้หลายตัว (แยกตามขนาด/ประเภทสัตว์)
 */
export const serviceRelations = relations(services, ({ many }) => ({
  variants: many(serviceVariants),
}));

/**
 * service_variants → services (N:1)
 * service_variants → appointment_items (1:N)
 */
export const serviceVariantRelations = relations(
  serviceVariants,
  ({ one, many }) => ({
    // variant เป็นของ service หลัก
    service: one(services, {
      fields: [serviceVariants.serviceId],
      references: [services.id],
    }),
    // variant ถูกใช้ใน appointmentItems หลายรายการ
    appointmentItems: many(appointmentItems),
  }),
);

// ===================================================
// 💰 FINANCE DOMAIN
// ===================================================

/**
 * payments → appointments (N:1)
 * การชำระเงินแต่ละรายการเป็นของนัดหมายหนึ่ง
 */
export const paymentRelations = relations(payments, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
  // payment หนึ่งอาจถูกอ้างอิงจาก verification ที่ผ่านแล้ว โดยทั่วไปจะมี 1 รายการ
  slipVerifications: many(paymentSlipVerifications),
}));

/**
 * paymentSlipVerifications → appointments/payments
 * verification ทุกครั้งผูกกับ appointment เสมอ แต่ payment เป็น optional
 * เพราะสลิปที่ REJECTED หรือ ERROR ยังไม่สร้าง payment จริง
 */
export const paymentSlipVerificationRelations = relations(
  paymentSlipVerifications,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [paymentSlipVerifications.appointmentId],
      references: [appointments.id],
    }),
    payment: one(payments, {
      fields: [paymentSlipVerifications.paymentId],
      references: [payments.id],
    }),
  }),
);

/**
 * transactionCategories → transactions (1:N)
 * หมวดหมู่ธุรกรรมมีธุรกรรมได้หลายรายการ
 */
export const transactionCategoryRelations = relations(
  transactionCategories,
  ({ many }) => ({
    transactions: many(transactions),
  }),
);

/**
 * transactions → transactionCategories (N:1)
 * (transactions ไม่มี FK ไปยัง appointments หรือ purchase_orders แล้ว)
 */
export const transactionRelations = relations(transactions, ({ one }) => ({
  // transaction จัดอยู่ใน category หนึ่ง (บังคับ)
  category: one(transactionCategories, {
    fields: [transactions.transactionCategoryId],
    references: [transactionCategories.id],
  }),
}));

// ===================================================
// 📦 INVENTORY DOMAIN
// ===================================================

/**
 * inventoryCategories → inventoryItems (1:N)
 * หมวดหมู่สินค้ามีสินค้าได้หลายรายการ
 */
export const inventoryCategoryRelations = relations(
  inventoryCategories,
  ({ many }) => ({
    items: many(inventoryItems),
  }),
);

/**
 * inventoryItems → inventoryCategories (N:1)
 * inventoryItems → purchaseOrderItems (1:N)
 */
export const inventoryItemRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    // สินค้าอยู่ใน category หนึ่ง
    category: one(inventoryCategories, {
      fields: [inventoryItems.inventoryCategoryId],
      references: [inventoryCategories.id],
    }),
    // สินค้าถูกสั่งซื้อได้หลายครั้งในหลายใบสั่งซื้อ
    purchaseOrderItems: many(purchaseOrderItems),
  }),
);

/**
 * purchaseOrders → purchaseOrderItems (1:N)
 * (staffId ยังไม่มี FK constraint จริง — relation ใช้งานได้ตอน query)
 */
export const purchaseOrderRelations = relations(
  purchaseOrders,
  ({ many, one }) => ({
    // ใบสั่งซื้อมีรายการสินค้าหลายรายการ
    items: many(purchaseOrderItems),
    // ใบสั่งซื้อสร้างโดย staff คนหนึ่ง
    staff: one(staffs, {
      fields: [purchaseOrders.staffId],
      references: [staffs.id],
    }),
  }),
);

/**
 * purchaseOrderItems → purchaseOrders (N:1)
 * purchaseOrderItems → inventoryItems (N:1)
 */
export const purchaseOrderItemRelations = relations(
  purchaseOrderItems,
  ({ one }) => ({
    // item เป็นส่วนหนึ่งของใบสั่งซื้อหนึ่ง
    purchaseOrder: one(purchaseOrders, {
      fields: [purchaseOrderItems.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
    // item สั่งซื้อสินค้าหนึ่งรายการ
    inventoryItem: one(inventoryItems, {
      fields: [purchaseOrderItems.inventoryItemId],
      references: [inventoryItems.id],
    }),
  }),
);

// ===================================================
// 🏪 STORE DOMAIN
// ===================================================

/**
 * reviews → appointments (N:1)
 * reviews → customers (N:1)
 */
export const reviewRelations = relations(reviews, ({ one }) => ({
  // รีวิวเป็นของนัดหมายหนึ่ง
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id],
  }),
  // รีวิวเขียนโดย customer คนหนึ่ง
  customer: one(customers, {
    fields: [reviews.customerId],
    references: [customers.id],
  }),
}));

// ===================================================
// 👔 STAFF DOMAIN
// ===================================================

/**
 * staffs → users (N:1)
 * staffs → purchaseOrders (1:N)
 */
export const staffRelations = relations(staffs, ({ one, many }) => ({
  // staff มี user account
  user: one(users, {
    fields: [staffs.userId],
    references: [users.id],
  }),
  // staff สร้างใบสั่งซื้อได้หลายใบ
  purchaseOrders: many(purchaseOrders),
}));

export const businessRuleRelations = relations(businessRules, ({ many }) => ({
  weeklyHours: many(businessWeeklyHours),
  dateOverrides: many(businessDateOverrides),
}));

export const businessWeeklyHoursRelations = relations(
  businessWeeklyHours,
  ({ one }) => ({
    businessRule: one(businessRules, {
      fields: [businessWeeklyHours.businessRuleId],
      references: [businessRules.id],
    }),
  }),
);

export const businessDateOverrideRelations = relations(
  businessDateOverrides,
  ({ one, many }) => ({
    businessRule: one(businessRules, {
      fields: [businessDateOverrides.businessRuleId],
      references: [businessRules.id],
    }),
    hours: many(businessDateOverrideHours),
  }),
);

export const businessDateOverrideHoursRelations = relations(
  businessDateOverrideHours,
  ({ one }) => ({
    override: one(businessDateOverrides, {
      fields: [businessDateOverrideHours.businessDateOverrideId],
      references: [businessDateOverrides.id],
    }),
  }),
);

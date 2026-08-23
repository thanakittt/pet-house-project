import { pgEnum } from "drizzle-orm/pg-core";

export const petTypeEnum = pgEnum("pet_type", ["DOG", "CAT"]);
export const serviceTypeEnum = pgEnum("service_type", ["MAIN", "ADDON"]);
export const petSizeEnum = pgEnum("pet_size", ["S", "M", "L", "ALL"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "PENDING_DEPOSIT",
  "PENDING_APPROVAL",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export const lineAppointmentTemplateTypeEnum = pgEnum(
  "line_appointment_template_type",
  ["customer", "staff"],
);
export const serviceImageTypeEnum = pgEnum("service_image_type", [
  "BEFORE",
  "AFTER",
  "ISSUE",
]);
export const paymentMethodTypeEnum = pgEnum("payment_method", [
  "CASH",
  "TRANSFER",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "CANCELLED",
]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "DEPOSIT",
  "FULL_PAYMENT",
]);

// สถานะผลการตรวจสลิปจาก provider:
// VERIFIED = ผ่านและนำไปสร้าง payment แล้ว
// REJECTED = provider ตอบกลับได้ แต่สลิปไม่ผ่านเงื่อนไข เช่น ยอดผิด/ซ้ำ/บัญชีไม่ตรง
// ERROR = ระบบเรียก provider หรือบันทึกผลไม่สำเร็จ ใช้สำหรับ debug/ตรวจย้อนหลัง
export const slipVerificationStatusEnum = pgEnum("slip_verification_status", [
  "VERIFIED",
  "REJECTED",
  "ERROR",
]);
export const announcementTypeEnum = pgEnum("announcement_type", [
  "NEWS",
  "PROMOTION",
  "ALERT",
]);
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "UNSPECIFIED"]);
export const unitTypeEnum = pgEnum("unit", [
  "PIECE",
  "BOX",
  "PACK",
  "GALLON",
  "BOTTLE",
]);
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "DRAFT",
  "ORDERED",
  "RECEIVED",
  "CANCELLED",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "EXPENSE",
  "INCOME",
]);

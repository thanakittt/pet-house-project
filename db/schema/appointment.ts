import * as p from "drizzle-orm/pg-core";
import { appointmentStatusEnum, serviceImageTypeEnum } from "./enum";
import { customers, pets } from "./customer";
import { timestamps } from "./column.helper";
import { serviceVariants } from "./service";
import { sql } from "drizzle-orm";

// ตาราง appointments: เก็บข้อมูลการนัดหมาย
// index บน customer_id และ appointment_date เพื่อเร่งการค้นหาในหน้า calendar และประวัติลูกค้า
export const appointments = p
  .pgTable(
    "appointments",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      appointmentDate: p.date("appointment_date", { mode: "string" }).notNull(),
      note: p.text("note"),
      status: appointmentStatusEnum("status").notNull(),
      // FK ไปยัง customers (เจ้าของนัดหมาย)
      customerId: p
        .uuid("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูประวัตินัดหมายของลูกค้า (หน้าโปรไฟล์ลูกค้า)
      p.index("appointments_customer_id_idx").on(table.customerId),
      // index สำหรับค้นหานัดหมายตามวันที่ (หน้า calendar/schedule)
      p.index("appointments_date_idx").on(table.appointmentDate),
    ],
  )
  .enableRLS();

// ตาราง appointmentItems: เก็บรายการบริการแต่ละตัวภายในการนัดหมาย
// index บน appointment_id, pet_id, service_variant_id เพื่อเร่ง JOIN ทุกด้าน
export const appointmentItems = p
  .pgTable(
    "appointment_items",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      price: p
        .numeric("price", { precision: 8, scale: 2 })
        .default("0")
        .notNull(),
      startTime: p.timestamp("start_time", { withTimezone: true }).notNull(),
      endTime: p.timestamp("end_time", { withTimezone: true }).notNull(),
      // FK ไปยัง appointments
      appointmentId: p
        .uuid("appointment_id")
        .notNull()
        .references(() => appointments.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง pets (สัตว์เลี้ยงที่รับบริการ)
      petId: p
        .uuid("pet_id")
        .notNull()
        .references(() => pets.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง serviceVariants (ตัวเลือกบริการ)
      serviceVariantId: p
        .uuid("service_variant_id")
        .notNull()
        .references(() => serviceVariants.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดู items ทั้งหมดของนัดหมาย
      p.index("appointment_items_appointment_id_idx").on(table.appointmentId),
      // index สำหรับดูประวัติบริการของสัตว์เลี้ยง
      p.index("appointment_items_pet_id_idx").on(table.petId),
      // index สำหรับวิเคราะห์ว่า service variant ไหนถูกใช้บ่อย
      p
        .index("appointment_items_service_variant_id_idx")
        .on(table.serviceVariantId),
    ],
  )
  .enableRLS();

// ตาราง healthReports: เก็บรายงานสุขภาพสัตว์เลี้ยงจากการนัดหมาย
// index บน appointment_item_id เพื่อเร่ง JOIN ดูรายงานสุขภาพ
export const healthReports = p
  .pgTable(
    "health_reports",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      topic: p.text("topic").notNull(),
      description: p.text("description").notNull(),
      // FK ไปยัง appointmentItems
      appointmentItemId: p
        .uuid("appointment_item_id")
        .notNull()
        .references(() => appointmentItems.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูรายงานสุขภาพของ appointment item
      p
        .index("health_reports_appointment_item_id_idx")
        .on(table.appointmentItemId),
    ],
  )
  .enableRLS();

// ตาราง serviceImages: เก็บรูปภาพก่อน/หลังการให้บริการ
// index บน appointment_item_id เพื่อเร่ง JOIN ดูรูปภาพ
export const serviceImages = p
  .pgTable(
    "service_images",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      imageUrl: p.text("image_url").notNull(),
      type: serviceImageTypeEnum("type").notNull(), // "BEFORE", "AFTER", "ISSUE"
      // FK ไปยัง appointmentItems
      appointmentItemId: p
        .uuid("appointment_item_id")
        .notNull()
        .references(() => appointmentItems.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูรูปภาพของ appointment item (before/after photos)
      p
        .index("service_images_appointment_item_id_idx")
        .on(table.appointmentItemId),
    ],
  )
  .enableRLS();

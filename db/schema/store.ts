import * as p from "drizzle-orm/pg-core";
import { timestamps } from "./column.helper";
import { appointments } from "./appointment";
import { customers } from "./customer";
import { announcementTypeEnum } from "./enum";
import { sql } from "drizzle-orm";

// ตาราง reviews: เก็บรีวิวและคะแนนจากลูกค้า
// index บน appointment_id และ customer_id เพื่อเร่ง JOIN/Filter
export const reviews = p
  .pgTable(
    "reviews",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      rating: p.smallint("rating").notNull(),
      comment: p.text("comment"),
      // FK ไปยัง appointments (นัดหมายที่รีวิว)
      // UNIQUE เพื่อบังคับ 1:1 — 1 นัดหมายมีได้ 1 รีวิวเท่านั้น
      appointmentId: p
        .uuid("appointment_id")
        .notNull()
        .unique("reviews_appointment_id_unique")
        .references(() => appointments.id, {
          onDelete: "restrict",
        }),
      // FK ไปยัง customers (ลูกค้าที่รีวิว)
      customerId: p
        .uuid("customer_id")
        .notNull()
        .references(() => customers.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูรีวิวทั้งหมดของลูกค้า
      p.index("reviews_customer_id_idx").on(table.customerId),
      p.check(
        "rating_check",
        sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
      ),
    ],
  )
  .enableRLS();

// ตาราง announcements: เก็บประกาศ/ข่าวสารของร้าน
// composite index บน is_active + start_display_at
// เพื่อเร่ง query ดึงเฉพาะประกาศที่กำลังแสดงอยู่ ณ ปัจจุบัน
export const announcements = p
  .pgTable(
    "announcements",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      title: p.text("title").notNull(),
      content: p.text("content").notNull(),
      imageUrl: p.text("image_url"),
      type: announcementTypeEnum("type").notNull(),
      startDisplayAt: p
        .timestamp("start_display_at", { withTimezone: true })
        .notNull(),
      endDisplayAt: p.timestamp("end_display_at", { withTimezone: true }),
      isActive: p.boolean("is_active").default(true).notNull(),
      ...timestamps,
    },
    (table) => [
      // composite index สำหรับ query ประกาศที่ is_active=true และยังอยู่ในช่วงแสดงผล
      // ใช้บ่อยในหน้าแรกของแอป (WHERE is_active = true AND start_display_at <= now())
      p
        .index("announcements_active_date_idx")
        .on(table.isActive, table.startDisplayAt),
    ],
  )
  .enableRLS();

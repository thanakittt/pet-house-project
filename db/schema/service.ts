import * as p from "drizzle-orm/pg-core";
import { petSizeEnum, petTypeEnum, serviceTypeEnum } from "./enum";
import { timestamps } from "./column.helper";

// ตาราง services: เก็บข้อมูลบริการหลักของร้าน เช่น อาบน้ำ, ตัดขน
// ไม่มี FK → ไม่ต้องใส่ index เพิ่ม
export const services = p
  .pgTable("services", {
    id: p.uuid("id").defaultRandom().primaryKey(),
    name: p.text("name").notNull(),
    description: p.text("description"),
    serviceType: serviceTypeEnum("service_type").notNull(),
    ...timestamps,
  })
  .enableRLS();

// ตาราง service_variants: เก็บตัวเลือกย่อยของบริการ แยกตามขนาดสัตว์และประเภท
// index บน service_id เพื่อเร่ง JOIN ดู variants ทั้งหมดของ service
export const service_variants = p
  .pgTable(
    "service_variants",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      size: petSizeEnum("size").notNull(),
      basePrice: p.numeric("base_price", { precision: 8, scale: 2 }).notNull(),
      petType: petTypeEnum("pet_type").notNull(),
      durationMinutes: p.smallint("duration_minutes").notNull(),
      // FK ไปยัง services (บริการหลัก)
      serviceId: p
        .uuid("service_id")
        .notNull()
        .references(() => services.id, {
          onDelete: "restrict",
        }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดู variants ทั้งหมดของ service (ใช้ใน dropdown/ตารางบริการ)
      p.index("service_variants_service_id_idx").on(table.serviceId),
    ],
  )
  .enableRLS();

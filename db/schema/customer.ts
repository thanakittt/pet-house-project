import { pgTable, index } from "drizzle-orm/pg-core";
import { timestamps } from "./column.helper";
import { users } from "./auth";
import { genderEnum, petSizeEnum, petTypeEnum } from "./enum";
import * as p from "drizzle-orm/pg-core";

// ตาราง customers: เก็บข้อมูลลูกค้าของร้าน
export const customers = pgTable("customers", {
  id: p.uuid("id").defaultRandom().primaryKey(),
  nickname: p.text("nickname").notNull(),
  birthDate: p.date("birth_date"),
  gender: genderEnum("gender").default("UNSPECIFIED").notNull(),
  walkInPhoneNumber: p.text("walk_in_phone_number").unique(),
  // FK ไปยัง users (optional: ลูกค้าอาจยังไม่มี account)
  // UNIQUE เพื่อบังคับ 1:1 — 1 user เป็นได้ 1 customer เท่านั้น
  userId: p
    .text("user_id")
    .unique("customers_user_id_unique")
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
}).enableRLS();

// ตาราง petBreeds: เก็บข้อมูลสายพันธุ์สัตว์เลี้ยง (ไม่มี FK → ไม่ต้องใส่ index เพิ่ม)
export const petBreeds = pgTable("pet_breeds", {
  id: p.uuid("id").defaultRandom().primaryKey(),
  name: p.text("name").notNull(),
  type: petTypeEnum("type").notNull(),
  size: petSizeEnum("size").notNull().default("M"),
  ...timestamps,
}).enableRLS();

// ตาราง pets: เก็บข้อมูลสัตว์เลี้ยงของลูกค้า
// index บน customer_id และ pet_breed_id เพื่อเร่ง JOIN/Filter
export const pets = p
  .pgTable(
    "pets",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      name: p.text("name").notNull(),
      medicalNotes: p.text("medical_notes"),
      // FK ไปยัง customers (เจ้าของสัตว์เลี้ยง)
      customerId: p
        .uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "restrict" }),
      // FK ไปยัง petBreeds (สายพันธุ์)
      petBreedId: p
        .uuid("pet_breed_id")
        .notNull()
        .references(() => petBreeds.id, { onDelete: "restrict" }),
      ...timestamps,
    },
    (table) => [
      // index สำหรับดูสัตว์เลี้ยงทั้งหมดของลูกค้า (query บ่อยมาก)
      index("pets_customer_id_idx").on(table.customerId),
      // index สำหรับ filter สัตว์เลี้ยงตามสายพันธุ์
      index("pets_pet_breed_id_idx").on(table.petBreedId),
    ],
  )
  .enableRLS();

export type Customer = typeof customers.$inferSelect;
export type CustomerMutation = typeof customers.$inferInsert;

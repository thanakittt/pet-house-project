import * as p from "drizzle-orm/pg-core";
import { genderEnum } from "./enum";
import { timestamps } from "./column.helper";
import { users } from "./auth";

// ตาราง staffs: เก็บข้อมูลพนักงานในร้าน
// index บน user_id เพื่อเร่ง JOIN กับตาราง users
export const staffs = p
  .pgTable("staffs", {
    id: p.uuid("id").defaultRandom().primaryKey(),
    nickname: p.text("nickname").notNull(),
    gender: genderEnum("gender").notNull(),
    birthDate: p.date("birth_date"),
    lineUserId: p.text("line_user_id").unique("staffs_line_user_id_unique"),
    // FK ไปยัง users (account ของพนักงาน)
    // UNIQUE เพื่อบังคับ 1:1 — 1 user เป็นได้ 1 staff เท่านั้น
    userId: p
      .text("user_id")
      .notNull()
      .unique("staffs_user_id_unique")
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    ...timestamps,
  })
  .enableRLS();

export type Staff = typeof staffs.$inferSelect;
export type NewStaff = typeof staffs.$inferInsert;

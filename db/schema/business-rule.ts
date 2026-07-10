import * as p from "drizzle-orm/pg-core";
import { timestamps } from "./column.helper";

// ตาราง singleton สำหรับ policy การจองของร้าน
export const businessRules = p
  .pgTable("business_rules", {
    id: p.uuid("id").defaultRandom().primaryKey(),
    minBookingLeadMinutes: p.integer("min_booking_lead_minutes").default(0).notNull(),
    maxAdvanceBookingDays: p.integer("max_advance_booking_days")
      .default(90)
      .notNull(),
    slotIntervalMinutes: p.integer("slot_interval_minutes").default(30).notNull(),
    ...timestamps,
  })
  .enableRLS();

// รองรับหลายช่วงเวลาทำการในวันเดียวกัน เช่น 09:00-12:00 และ 13:00-18:00
export const businessWeeklyHours = p
  .pgTable(
    "business_weekly_hours",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      businessRuleId: p
        .uuid("business_rule_id")
        .notNull()
        .references(() => businessRules.id, { onDelete: "cascade" }),
      // 0 = Sunday, 6 = Saturday ตาม Date#getDay และ helper Bangkok ของโปรเจกต์
      dayOfWeek: p.smallint("day_of_week").notNull(),
      startTime: p.time("start_time", { withTimezone: false }).notNull(),
      endTime: p.time("end_time", { withTimezone: false }).notNull(),
      ...timestamps,
    },
    (table) => [
      p.index("business_weekly_hours_rule_day_idx").on(
        table.businessRuleId,
        table.dayOfWeek,
      ),
      p.unique("business_weekly_hours_rule_day_start_unique").on(
        table.businessRuleId,
        table.dayOfWeek,
        table.startTime,
      ),
    ],
  )
  .enableRLS();

// วันที่ตั้งค่าพิเศษ: ปิดทั้งวัน หรือแทนที่เวลารายสัปดาห์ด้วยช่วงเวลาใหม่
export const businessDateOverrides = p
  .pgTable(
    "business_date_overrides",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      businessRuleId: p
        .uuid("business_rule_id")
        .notNull()
        .references(() => businessRules.id, { onDelete: "cascade" }),
      date: p.date("date", { mode: "string" }).notNull(),
      isClosed: p.boolean("is_closed").default(false).notNull(),
      ...timestamps,
    },
    (table) => [
      p.unique("business_date_overrides_rule_date_unique").on(
        table.businessRuleId,
        table.date,
      ),
    ],
  )
  .enableRLS();

export const businessDateOverrideHours = p
  .pgTable(
    "business_date_override_hours",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      businessDateOverrideId: p
        .uuid("business_date_override_id")
        .notNull()
        .references(() => businessDateOverrides.id, { onDelete: "cascade" }),
      startTime: p.time("start_time", { withTimezone: false }).notNull(),
      endTime: p.time("end_time", { withTimezone: false }).notNull(),
      ...timestamps,
    },
    (table) => [
      p.index("business_date_override_hours_override_idx").on(
        table.businessDateOverrideId,
      ),
      p.unique("business_date_override_hours_override_start_unique").on(
        table.businessDateOverrideId,
        table.startTime,
      ),
    ],
  )
  .enableRLS();

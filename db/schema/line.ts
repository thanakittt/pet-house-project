import * as p from "drizzle-orm/pg-core";
import { timestamps } from "./column.helper";
import { appointmentStatusEnum, lineAppointmentTemplateTypeEnum } from "./enum";

// ตารางนี้เก็บ template ข้อความ LINE OA แยกตามผู้รับและสถานะนัดหมาย
// ผู้ใช้จะเป็นคน generate และ apply migration เอง จึงเพิ่มเฉพาะ schema ฝั่ง Drizzle
export const lineAppointmentStatusTemplates = p
  .pgTable(
    "line_appointment_status_templates",
    {
      id: p.uuid("id").defaultRandom().primaryKey(),
      type: lineAppointmentTemplateTypeEnum("type")
        .default("customer")
        .notNull(),
      status: appointmentStatusEnum("status").notNull(),
      messageTemplate: p.text("message_template").notNull(),
      isActive: p.boolean("is_active").default(true).notNull(),
      ...timestamps,
    },
    (table) => [
      p
        .uniqueIndex("line_appointment_status_templates_type_status_unique")
        .on(table.type, table.status),
    ],
  )
  .enableRLS();

export type LineAppointmentStatusTemplate =
  typeof lineAppointmentStatusTemplates.$inferSelect;
export type LineAppointmentStatusTemplateMutation =
  typeof lineAppointmentStatusTemplates.$inferInsert;

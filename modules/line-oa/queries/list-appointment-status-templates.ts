import { db } from "@/db";
import { lineAppointmentStatusTemplates } from "@/db/schema";
import { inArray } from "drizzle-orm";
import {
  getDefaultLineTemplateView,
  LINE_NOTIFIABLE_APPOINTMENT_STATUSES,
  type LineAppointmentStatusTemplateView,
  type LineNotifiableAppointmentStatus,
} from "../types/appointment-status-template";

export async function listAppointmentStatusTemplates(): Promise<
  LineAppointmentStatusTemplateView[]
> {
  const defaultTemplates = LINE_NOTIFIABLE_APPOINTMENT_STATUSES.map((status) =>
    getDefaultLineTemplateView(status),
  );

  try {
    const rows = await db
      .select({
        id: lineAppointmentStatusTemplates.id,
        status: lineAppointmentStatusTemplates.status,
        messageTemplate: lineAppointmentStatusTemplates.messageTemplate,
        isActive: lineAppointmentStatusTemplates.isActive,
      })
      .from(lineAppointmentStatusTemplates)
      .where(
        inArray(
          lineAppointmentStatusTemplates.status,
          LINE_NOTIFIABLE_APPOINTMENT_STATUSES,
        ),
      );

    const rowByStatus = new Map(
      rows.map((row) => [row.status as LineNotifiableAppointmentStatus, row]),
    );

    return defaultTemplates.map((defaultTemplate) => {
      const storedTemplate = rowByStatus.get(defaultTemplate.status);

      if (!storedTemplate) {
        return defaultTemplate;
      }

      return {
        ...defaultTemplate,
        id: storedTemplate.id,
        messageTemplate: storedTemplate.messageTemplate,
        isActive: storedTemplate.isActive,
        isDefault: false,
      };
    });
  } catch (error) {
    console.error("listAppointmentStatusTemplates error:", error);

    // ถ้ายังไม่ได้ migrate ตารางใหม่ ให้หน้า LINE OA ยังเปิดได้โดยใช้ค่า default ไปก่อน
    return defaultTemplates;
  }
}

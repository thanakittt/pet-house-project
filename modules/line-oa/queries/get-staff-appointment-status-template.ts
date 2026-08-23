import { db } from "@/db";
import { lineAppointmentStatusTemplates } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  getDefaultStaffLineTemplateView,
  STAFF_LINE_TEMPLATE_STATUS,
  type StaffLineAppointmentStatusTemplateView,
} from "../types/staff-appointment-status-template";

export async function getStaffAppointmentStatusTemplate(): Promise<StaffLineAppointmentStatusTemplateView> {
  const defaultTemplate = getDefaultStaffLineTemplateView();

  try {
    const [storedTemplate] = await db
      .select({
        id: lineAppointmentStatusTemplates.id,
        status: lineAppointmentStatusTemplates.status,
        messageTemplate: lineAppointmentStatusTemplates.messageTemplate,
        isActive: lineAppointmentStatusTemplates.isActive,
      })
      .from(lineAppointmentStatusTemplates)
      .where(
        and(
          eq(lineAppointmentStatusTemplates.type, "staff"),
          eq(
            lineAppointmentStatusTemplates.status,
            STAFF_LINE_TEMPLATE_STATUS,
          ),
        ),
      )
      .limit(1);

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
  } catch (error) {
    console.error("getStaffAppointmentStatusTemplate error:", error);
    return defaultTemplate;
  }
}

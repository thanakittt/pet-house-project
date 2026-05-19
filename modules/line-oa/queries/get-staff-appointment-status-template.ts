import { db } from "@/db";
import { lineStaffAppointmentStatusTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
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
        id: lineStaffAppointmentStatusTemplates.id,
        status: lineStaffAppointmentStatusTemplates.status,
        messageTemplate: lineStaffAppointmentStatusTemplates.messageTemplate,
        isActive: lineStaffAppointmentStatusTemplates.isActive,
      })
      .from(lineStaffAppointmentStatusTemplates)
      .where(
        eq(
          lineStaffAppointmentStatusTemplates.status,
          STAFF_LINE_TEMPLATE_STATUS,
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

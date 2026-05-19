"use server";

import { db } from "@/db";
import { lineStaffAppointmentStatusTemplates } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import type { ActionResponse } from "@/types/action";
import { revalidatePath } from "next/cache";
import {
  STAFF_LINE_TEMPLATE_STATUS,
  validateStaffLineTemplateInput,
} from "../types/staff-appointment-status-template";

export async function updateStaffAppointmentStatusTemplate(input: {
  messageTemplate: string;
  isActive: boolean;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์แก้ไข template แจ้งเตือน LINE OA",
      };
    }

    const validatedTemplate = validateStaffLineTemplateInput(
      input.messageTemplate,
    );

    if (!validatedTemplate.success) {
      return validatedTemplate;
    }

    await db
      .insert(lineStaffAppointmentStatusTemplates)
      .values({
        status: STAFF_LINE_TEMPLATE_STATUS,
        messageTemplate: validatedTemplate.messageTemplate,
        isActive: input.isActive,
      })
      .onConflictDoUpdate({
        target: lineStaffAppointmentStatusTemplates.status,
        set: {
          messageTemplate: validatedTemplate.messageTemplate,
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/back-office/line-oa");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updateStaffAppointmentStatusTemplate error:", error);

    return {
      success: false,
      error:
        "บันทึก template พนักงานไม่สำเร็จ กรุณาตรวจสอบว่า migration ของตาราง LINE OA ถูกรันแล้ว",
    };
  }
}

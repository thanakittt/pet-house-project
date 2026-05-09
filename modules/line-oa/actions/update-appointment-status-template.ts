"use server";

import { db } from "@/db";
import { lineAppointmentStatusTemplates } from "@/db/schema";
import { requireAdminAndOwner } from "@/lib/session";
import type { ActionResponse } from "@/types/action";
import { revalidatePath } from "next/cache";
import {
  isLineAppointmentStatusTemplateStatus,
  validateLineTemplateInput,
  type LineNotifiableAppointmentStatus,
} from "../types/appointment-status-template";

export async function updateAppointmentStatusTemplate(input: {
  status: LineNotifiableAppointmentStatus;
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

    if (!isLineAppointmentStatusTemplateStatus(input.status)) {
      return {
        success: false,
        error: "สถานะนัดหมายไม่รองรับการแจ้งเตือน LINE OA",
      };
    }

    const validatedTemplate = validateLineTemplateInput(input.messageTemplate);

    if (!validatedTemplate.success) {
      return validatedTemplate;
    }

    await db
      .insert(lineAppointmentStatusTemplates)
      .values({
        status: input.status,
        messageTemplate: validatedTemplate.messageTemplate,
        isActive: input.isActive,
      })
      .onConflictDoUpdate({
        target: lineAppointmentStatusTemplates.status,
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
    console.error("updateAppointmentStatusTemplate error:", error);

    return {
      success: false,
      error:
        "บันทึก template ไม่สำเร็จ กรุณาตรวจสอบว่า migration ของตาราง LINE OA ถูกสร้างและรันแล้ว",
    };
  }
}

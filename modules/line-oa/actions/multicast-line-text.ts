"use server";

import { multicastLineTextMessage } from "@/lib/line/messaging";
import { requireAdminAndOwner } from "@/lib/session";
import type { ActionResponse } from "@/types/action";
import { validateMulticastInput } from "../types/multicast";

export async function multicastLineText(input: {
  text: string;
  targetUserIds: string[];
}): Promise<ActionResponse<{ recipientCount: number }>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ส่งข้อความ Multicast ผ่าน LINE OA",
      };
    }

    const validation = validateMulticastInput(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error ?? "ข้อมูลไม่ถูกต้อง",
      };
    }

    await multicastLineTextMessage(validation.sanitizedUserIds, input.text.trim());

    return {
      success: true,
      data: {
        recipientCount: validation.sanitizedUserIds.length,
      },
    };
  } catch (error) {
    console.error("multicastLineText error:", error);

    return {
      success: false,
      error:
        "ส่งข้อความผ่าน LINE OA ไม่สำเร็จ กรุณาตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN หรือโควตาการส่งข้อความ",
    };
  }
}

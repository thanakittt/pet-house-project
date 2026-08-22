"use server";

import { broadcastLineTextMessage } from "@/lib/line/messaging";
import { requireAdminAndOwner } from "@/lib/session";
import type { ActionResponse } from "@/types/action";

const MAX_LINE_TEXT_LENGTH = 5000;

export async function broadcastLineText(input: {
  text: string;
}): Promise<ActionResponse<null>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ส่งข้อความ Broadcast ผ่าน LINE OA",
      };
    }

    // รับข้อความจากฟอร์ม แล้ว trim เพื่อกันการส่งข้อความที่มีแต่ช่องว่าง
    const text = input.text.trim();

    if (!text) {
      return {
        success: false,
        error: "กรุณากรอกข้อความที่ต้องการส่ง",
      };
    }

    // LINE text message จำกัด 5,000 UTF-16 code units ซึ่งตรงกับ string.length ของ JavaScript
    if (text.length > MAX_LINE_TEXT_LENGTH) {
      return {
        success: false,
        error: "ข้อความต้องไม่เกิน 5,000 ตัวอักษร",
      };
    }

    await broadcastLineTextMessage(text);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("broadcastLineText error:", error);

    return {
      success: false,
      error:
        "ส่งข้อความผ่าน LINE OA ไม่สำเร็จ กรุณาตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN หรือโควตาการส่งข้อความ",
    };
  }
}

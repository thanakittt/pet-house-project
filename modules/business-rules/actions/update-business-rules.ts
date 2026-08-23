"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAndOwner } from "@/lib/session";
import type { ActionResponse } from "@/types/action";
import {
  replaceBusinessRules,
} from "../business-rules";
import type { UpdateBusinessRulesInput } from "../validation";

export async function updateBusinessRules(
  input: UpdateBusinessRulesInput,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireAdminAndOwner({ redirect: false });
    if (!session) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์แก้ไขการตั้งค่าร้าน",
      };
    }

    const result = await replaceBusinessRules(input);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/back-office/settings");
    revalidatePath("/back-office/appointments");
    revalidatePath("/back-office/appointments/create");
    revalidatePath("/appointments/new");

    return { success: true, data: null };
  } catch (error) {
    console.error("updateBusinessRules error:", error);
    return {
      success: false,
      error: "บันทึกการตั้งค่าร้านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

"use server";

import { db } from "@/db";
import { staffs } from "@/db/schema";
import { CreateStaffForm } from "@/modules/auth/types/create-user-form";
import { ActionResponse } from "@/types/action";

export async function createStaff(
  data: CreateStaffForm,
): Promise<ActionResponse<null>> {
  try {
    await db.insert(staffs).values({
      userId: data.userId,
      nickname: data.nickname,
      gender:
        (data.gender as "MALE" | "FEMALE" | "UNSPECIFIED") || "UNSPECIFIED",
      birthDate: data.birthDate || undefined,
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("CreateStaff Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างข้อมูลพนักงาน",
    };
  }
}

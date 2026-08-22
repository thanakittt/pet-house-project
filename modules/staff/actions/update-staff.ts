"use server";

import { db } from "@/db";
import { UpdateStaffForm } from "../types/staff";
import { staffs } from "@/db/schema";

export async function updateStaff(data: UpdateStaffForm) {
  try {
    const updateData = {
      nickname: data.nickname,
      gender: data.gender as "MALE" | "FEMALE" | "UNSPECIFIED",
      birthDate: data.birthDate,
    };

    await db
      .insert(staffs)
      .values({
        ...updateData,
        userId: data.userId,
      })
      .onConflictDoUpdate({
        target: staffs.userId,
        set: {
          ...updateData,
        },
      });

    return { success: true };
  } catch (error) {
    console.error("UpdateStaff Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลพนักงาน" };
  }
}

"use server";

import { auth } from "@/lib/auth";
import { UpdateUserForm } from "../types/create-user-form";
import { headers } from "next/headers";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";
import { updateStaff } from "@/modules/staff/actions/update-staff";

export async function updateUser(data: UpdateUserForm) {
  try {
    await auth.api.adminUpdateUser({
      body: {
        userId: data.userId,
        data: {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          role: data.role,
        },
      },
      headers: await headers(),
    });

    if (data.password) {
      await auth.api.setUserPassword({
        body: {
          userId: data.userId,
          newPassword: data.password,
        },
        headers: await headers(),
      });
    }

    if (
      (data.gender || data.birthDate) &&
      (data.role === "staff" || data.role === "admin" || data.role === "owner")
    ) {
      const updateStaffResult = await updateStaff({
        userId: data.userId,
        gender: data.gender,
        birthDate: data.birthDate,
        nickname: data.nickname,
      });

      if (!updateStaffResult.success) {
        return { success: false, error: updateStaffResult.error };
      }
    }

    if ((data.gender || data.birthDate) && data.role === "customer") {
      return { success: false, error: "ระบบยังไม่รองรับการแก้ไขข้อมูลลูกค้า" };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("UpdateUser Error:", error);

    if (
      error instanceof DrizzleQueryError &&
      error.cause instanceof DatabaseError
    ) {
      if (
        error.cause.code === "23505" &&
        error.cause.constraint?.includes("email")
      ) {
        return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" };
      }

      if (
        error.cause.code === "23505" &&
        error.cause.constraint?.includes("phone_number")
      ) {
        return { success: false, error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" };
      }
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้" };
  }
}

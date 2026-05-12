"use server";

import { auth } from "@/lib/auth";
import { UpdateUserForm } from "../types/create-user-form";
import { headers } from "next/headers";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { updateStaff } from "@/modules/staff/actions/update-staff";
import { db } from "@/db";
import { customers } from "@/db/schema";

export async function updateUser(data: UpdateUserForm) {
  try {
    const name = data.name?.trim();
    const nickname = data.nickname?.trim();
    const email = data.email?.trim();
    const phoneNumber = data.phoneNumber?.trim();
    const gender = data.gender?.trim();
    const birthDate = data.birthDate?.trim();
    const role = data.role?.trim();

    const hasBlankRequiredValue = [
      data.name,
      data.nickname,
      data.email,
      data.phoneNumber,
      data.gender,
      data.birthDate,
      data.role,
    ].some((value) => value !== undefined && value.trim().length === 0);

    if (hasBlankRequiredValue) {
      return { success: false, error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
    }

    if (
      data.password !== undefined &&
      data.password.length > 0 &&
      data.password.length < 8
    ) {
      return {
        success: false,
        error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
      };
    }

    await auth.api.adminUpdateUser({
      body: {
        userId: data.userId,
        data: {
          name,
          email,
          phoneNumber,
          role,
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
      (gender || birthDate) &&
      (role === "staff" || role === "admin" || role === "owner")
    ) {
      const updateStaffResult = await updateStaff({
        userId: data.userId,
        gender,
        birthDate,
        nickname,
      });

      if (!updateStaffResult.success) {
        return { success: false, error: updateStaffResult.error };
      }
    }

    // ตรวจสอบว่ามีฟิลด์ที่ต้องซิงค์ลง customers หรือไม่
    // รวม nickname ด้วย เพื่อให้การเปลี่ยนชื่ออย่างเดียวก็ซิงค์ได้
    if ((nickname || gender || birthDate || phoneNumber) && role === "customer") {
      await db
        .update(customers)
        .set({
          nickname,
          walkInPhoneNumber: phoneNumber,
          gender: gender as "MALE" | "FEMALE" | "UNSPECIFIED",
          birthDate,
        })
        .where(eq(customers.userId, data.userId));
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

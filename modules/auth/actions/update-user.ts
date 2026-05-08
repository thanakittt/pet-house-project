"use server";

import { auth } from "@/lib/auth";
import { UpdateUserForm } from "../types/create-user-form";
import { headers } from "next/headers";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { updateStaff } from "@/modules/staff/actions/update-staff";
import { updateCustomer } from "@/modules/customer/actions/update-customer";
import { db } from "@/db";
import { customers } from "@/db/schema";

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

    console.log("data.role", data.role);

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

    // ตรวจสอบว่ามีฟิลด์ที่ต้องซิงค์ลง customers หรือไม่
    // รวม nickname ด้วย เพื่อให้การเปลี่ยนชื่ออย่างเดียวก็ซิงค์ได้
    if ((data.nickname || data.gender || data.birthDate || data.phoneNumber) && data.role === "customer") {
       await db
        .update(customers)
        .set({
          nickname: data.nickname,
          walkInPhoneNumber: data.phoneNumber,
          gender: data.gender as "MALE" | "FEMALE" | "UNSPECIFIED",
          birthDate: data.birthDate,
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

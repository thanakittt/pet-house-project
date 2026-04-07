"use server";

import { auth } from "@/lib/auth";
import { UserForm } from "@/modules/auth/types/create-user-form";
import { ActionResponse } from "@/types/action";
import { isAPIError } from "better-auth/api";
import { isPhoneNumberExists } from "../queries/get-user";
import { createStaff } from "@/modules/staff/actions/create-staff";
import { headers } from "next/headers";

export async function createUser(
  data: UserForm,
): Promise<ActionResponse<null>> {
  try {
    const isPhoneNumberExistsResult = await isPhoneNumberExists(
      data.phoneNumber,
    );

    if (!isPhoneNumberExistsResult.success) {
      return { success: false, error: isPhoneNumberExistsResult.error };
    }

    if (isPhoneNumberExistsResult.data.exists) {
      return { success: false, error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" };
    }

    const signUpResult = await auth.api.createUser({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role as "customer" | "staff" | "admin" | "owner",
        data: {
          phoneNumber: data.phoneNumber,
        },
      },
    });

    if (!signUpResult.user) {
      throw new Error();
    }

    if (
      (data.birthDate || data.gender) &&
      ["staff", "admin", "owner"].includes(data.role)
    ) {
      const createStaffResult = await createStaff({
        userId: signUpResult.user.id,
        nickname: data.name,
        gender: data.gender,
        birthDate: data.birthDate,
      });

      // ถ้าสร้าง Staff ล้มเหลว ให้ลบ user ที่เพิ่งสร้างออกเพื่อ rollback สภาพ
      // (compensation pattern: ป้องกัน orphaned auth record)
      if (!createStaffResult.success) {
        try {
          await auth.api.removeUser({
            body: { userId: signUpResult.user.id },
            headers: await headers(),
          });
        } catch (cleanupError) {
          // log เฉพาะเพื่อช่วย debug — ไม่ throw ซ้ำเพราะยังต้องส่ง error เดิมคืน
          console.error(
            `[createUser] Rollback failed – ลบ user id=${signUpResult.user.id} ไม่สำเร็จ:`,
            cleanupError,
          );
        }
        return { success: false, error: createStaffResult.error };
      }
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("CreateUser Error:", error);

    if (
      isAPIError(error) &&
      error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
    ) {
      return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้" };
  }
}

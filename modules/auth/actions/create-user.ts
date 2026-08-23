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
    const name = data.name.trim();
    const email = data.email.trim();
    const phoneNumber = data.phoneNumber.trim();
    const gender = data.gender.trim();
    const birthDate = data.birthDate.trim();
    const role = data.role.trim();

    if (
      !name ||
      !email ||
      !phoneNumber ||
      !data.password.trim() ||
      !gender ||
      !birthDate ||
      !role
    ) {
      return { success: false, error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
    }

    const isPhoneNumberExistsResult = await isPhoneNumberExists(
      phoneNumber,
    );

    if (!isPhoneNumberExistsResult.success) {
      return { success: false, error: isPhoneNumberExistsResult.error };
    }

    if (isPhoneNumberExistsResult.data.exists) {
      return { success: false, error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" };
    }

    const signUpResult = await auth.api.createUser({
      body: {
        name,
        email,
        password: data.password,
        role: role as "customer" | "staff" | "admin" | "owner",
        data: {
          phoneNumber,
        },
      },
    });

    if (!signUpResult.user) {
      throw new Error();
    }

    if (
      (birthDate || gender) &&
      ["staff", "admin", "owner"].includes(role)
    ) {
      const createStaffResult = await createStaff({
        userId: signUpResult.user.id,
        nickname: name,
        gender,
        birthDate,
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

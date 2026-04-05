"use server";

import { auth } from "@/lib/auth";
import { CreateUserForm } from "@/modules/auth/types/create-user-form";
import { ActionResponse } from "@/types/action";
import { isAPIError } from "better-auth/api";
import { isPhoneNumberExists } from "../queries/get-user";
import { createStaff } from "@/modules/staff/actions/create-staff";

export async function createUser(
  data: CreateUserForm,
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

    if (data.birthDate || data.gender) {
      const createStaffResult = await createStaff({
        userId: signUpResult.user.id,
        nickname: data.name,
        gender: data.gender?.toUpperCase() ?? "UNSPECIFIED",
        birthDate: data.birthDate,
      });
      if (!createStaffResult.success) {
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

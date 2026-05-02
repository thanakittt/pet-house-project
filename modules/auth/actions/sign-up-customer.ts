"use server";

import { isAPIError } from "better-auth/api";
import { isPhoneNumberExists } from "../queries/get-user";
import { SignUpFormData } from "../types/sign-up";
import { ActionResponse } from "@/types/action";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function signUpCustomer(
  data: Omit<SignUpFormData, "confirmPassword">,
): Promise<ActionResponse<null>> {
  let createUserId: string | null = null;
  try {
    const isPhoneNumberExistsResult = await isPhoneNumberExists(data.phone);

    if (!isPhoneNumberExistsResult.success) {
      return { success: false, error: isPhoneNumberExistsResult.error };
    }

    if (isPhoneNumberExistsResult.data.exists) {
      return { success: false, error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว" };
    }

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,
      },
    });

    if (!signUpResult.user) {
      throw new Error("Failed to create user");
    }

    createUserId = signUpResult.user.id;

    const [customer] = await db
      .insert(customers)
      .values({
        userId: signUpResult.user.id,
        nickname: data.name,
        walkInPhoneNumber: data.phone,
        gender: "UNSPECIFIED",
      })
      .returning({ id: customers.id });

    return { success: true, data: null };
  } catch (error) {
    // Rollback user creation if customer creation failed
    if (createUserId) {
      try {
        await db.delete(users).where(eq(users.id, createUserId));
      } catch (cleanupError) {
        console.error(
          `[signUpCustomer] Rollback failed – ลบ user id=${createUserId} ไม่สำเร็จ:`,
          cleanupError,
        );
      }
    }

    console.error("[signUpCustomer] Error:", error);

    if (
      isAPIError(error) &&
      error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
    ) {
      return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง",
    };
  }
}

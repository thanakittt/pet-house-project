"use server";

import { ActionResponse } from "@/types/action";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { SetupProfileData } from "../types/setup-profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireCustomer } from "@/lib/session";

export async function setupProfile(
  data: SetupProfileData,
): Promise<ActionResponse<null>> {
  try {
    const session = await requireCustomer({ redirect: false });
    const userId = session?.user.id;
    if (!userId) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้" };
    }

    await db.insert(customers).values({
      nickname: data.nickname,
      walkInPhoneNumber: data.walkInPhoneNumber,
      gender: data.gender,
      userId: userId,
      birthDate: data.birthDate || null,
    });

    try {
      await auth.api.updateUser({
        body: {
          phoneNumber: data.walkInPhoneNumber,
        },
        headers: await headers(),
      });
    } catch (updateError) {
      try {
        await db.delete(customers).where(eq(customers.userId, userId));
      } catch (rollbackError) {
        console.error("SetupProfile rollback failed:", rollbackError);
      }
      throw updateError;
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("SetupProfile Error:", error);

    if (
      error instanceof DrizzleQueryError &&
      error.cause instanceof DatabaseError &&
      error.cause.code === "23505" &&
      (error.cause.constraint?.includes("walk_in_phone_number") ||
        error.cause.constraint?.includes("phone_number"))
    ) {
      return { success: false, error: "เบอร์โทรศัพท์นี้มีอยู่แล้ว" };
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการตั้งค่าโปรไฟล์" };
  }
}

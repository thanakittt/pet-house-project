"use server";

import { ActionResponse } from "@/types/action";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { DatabaseError } from "pg";
import { SetupProfileData } from "../types/setup-profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function setupProfile(
  data: SetupProfileData,
): Promise<ActionResponse<null>> {
  try {
    await db.insert(customers).values({
      nickname: data.nickname,
      walkInPhoneNumber: data.walkInPhoneNumber,
      gender: data.gender,
      userId: data.userId,
    });

    try {
      await auth.api.updateUser({
        body: {
          phoneNumber: data.walkInPhoneNumber,
        },
        headers: await headers(),
      });
    } catch (updateError) {
      await db.delete(customers).where(eq(customers.userId, data.userId));
      throw updateError;
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("SetupProfile Error:", error);

    if (
      error instanceof DrizzleQueryError &&
      error.cause instanceof DatabaseError &&
      error.cause.code === "23505" &&
      error.cause.constraint?.includes("walk_in_phone_number")
    ) {
      return { success: false, error: "เบอร์โทรศัพท์นี้มีอยู่แล้ว" };
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการตั้งค่าโปรไฟล์" };
  }
}

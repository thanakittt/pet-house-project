"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { count, eq } from "drizzle-orm";

export async function isPhoneNumberExists(
  phoneNumber: string,
): Promise<ActionResponse<{ exists: boolean }>> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber));

    return {
      success: true,
      data: { exists: result.count > 0 },
    };
  } catch (error) {
    console.error("isPhoneNumberExists Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทรศัพท์",
    };
  }
}

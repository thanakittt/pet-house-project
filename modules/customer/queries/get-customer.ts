"use server";

import { ActionResponse } from "@/types/action";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { customers } from "@/db/schema";

export async function isCustomerExisted(
  userId: string,
): Promise<ActionResponse<{ exists: boolean }>> {
  try {
    const result = await db.query.customers.findFirst({
      columns: {
        id: true,
      },
      where: eq(customers.userId, userId),
    });

    return { success: true, data: { exists: result !== undefined } };
  } catch (error) {
    console.error("[isCustomerExisted] error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้",
    };
  }
}

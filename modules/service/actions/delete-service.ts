"use server";

import { db } from "@/db";
import { services } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { eq } from "drizzle-orm";

export async function deleteService({ id }: { id: string }): Promise<ActionResponse<null>> {
  try {
    const result = await db
      .update(services)
      .set({ deletedAt: new Date() })
      .where(eq(services.id, id))
      .returning({ id: services.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลบริการ",
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("deleteService error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลบริการ",
    };
  }
}

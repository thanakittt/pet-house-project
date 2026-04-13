"use server";

import { db } from "@/db";
import { serviceVariants } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

export async function deleteServiceVariant({ id }: { id: string }): Promise<ActionResponse<null>> {
  try {
    const result = await db
      .update(serviceVariants)
      .set({ deletedAt: new Date() })
      .where(and(eq(serviceVariants.id, id), isNull(serviceVariants.deletedAt)))
      .returning({ id: serviceVariants.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลตัวเลือกบริการที่ต้องการลบ",
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("deleteServiceVariant error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลตัวเลือกบริการ",
    };
  }
}

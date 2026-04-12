"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function deletePet({ id }: { id: string }) {
  try {
    const result = await db
      .update(pets)
      .set({ deletedAt: new Date() })
      .where(and(eq(pets.id, id), isNull(pets.deletedAt)))
      .returning({ id: pets.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสัตว์เลี้ยงที่ต้องการลบ",
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("deletePet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลสัตว์เลี้ยง",
    };
  }
}

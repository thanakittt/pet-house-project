"use server";

import { db } from "@/db";
import { petBreeds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deletePetBreed({ id }: { id: string }) {
  try {
    const result = await db
      .update(petBreeds)
      .set({ deletedAt: new Date() })
      .where(eq(petBreeds.id, id))
      .returning({ id: petBreeds.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยง",
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("deletePetBreed error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลสายพันธุ์สัตว์เลี้ยง",
    };
  }
}

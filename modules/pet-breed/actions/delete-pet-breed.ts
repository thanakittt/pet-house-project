"use server";

import { db } from "@/db";
import { petBreeds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deletePetBreed({ id }: { id: string }) {
  try {
    await db
      .update(petBreeds)
      .set({ deletedAt: new Date() })
      .where(eq(petBreeds.id, id));

    return { success: true, data: null };
  } catch (error) {
    console.error("deletePetBreed error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการลบข้อมูลสายพันธุ์สัตว์เลี้ยง",
    };
  }
}
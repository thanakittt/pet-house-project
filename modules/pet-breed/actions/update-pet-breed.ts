"use server";

import { db } from "@/db";
import { PetBreed } from "../types/pet-breed";
import { petBreeds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ActionResponse } from "@/types/action";

export async function updatePetBreed(data: PetBreed): Promise<ActionResponse<null>> {
  try {

    const result = await db
      .update(petBreeds)
      .set({
        name: data.name,
        type: data.type as "DOG" | "CAT",
        size: data.size as "S" | "M" | "L",
      })
      .where(eq(petBreeds.id, data.id))
      .returning({ id: petBreeds.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยงที่ต้องการแก้ไข",
      };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("UpdatePetBreed Error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสายพันธุ์สัตว์เลี้ยง",
    };
  }
}

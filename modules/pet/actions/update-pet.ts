"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UpdatePetForm } from "../types/pet";
import { ActionResponse } from "@/types/action";

export async function updatePet(
  data: UpdatePetForm,
): Promise<ActionResponse<null>> {
  try {
    const result = await db
      .update(pets)
      .set({
        name: data.name,
        medicalNotes: data.medicalNotes === "" ? null : data.medicalNotes,
        petBreedId: data.petBreedId,
      })
      .where(eq(pets.id, data.petId))
      .returning({ id: pets.id });

    if (result.length === 0) {
      return {
        success: false,
        error: "ไม่พบสัตว์เลี้ยงที่ต้องการแก้ไข",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("updatePet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสัตว์เลี้ยง",
    };
  }
}

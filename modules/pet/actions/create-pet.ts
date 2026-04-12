"use server";

import { db } from "@/db";
import { PetForm } from "../types/pet";
import { pets } from "@/db/schema";
import { ActionResponse } from "@/types/action";

export async function createPet(data: PetForm): Promise<ActionResponse<null>> {
  try {
    await db.insert(pets).values({
      name: data.name,
      medicalNotes: data.medicalNotes === "" ? undefined : data.medicalNotes,
      petBreedId: data.petBreedId,
      customerId: data.customerId,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("CreatePet Error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสัตว์เลี้ยง",
    };
  }
}

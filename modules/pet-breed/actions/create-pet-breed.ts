"use server";

import { db } from "@/db";
import { PetBreedForm } from "../types/pet-breed";
import { petBreeds } from "@/db/schema";
import { ActionResponse } from "@/types/action";

export async function createPetBreed(data: PetBreedForm): Promise<ActionResponse<null>> {
  try {
    await db.insert(petBreeds).values({
      name: data.name,
      type: data.type as "DOG" | "CAT",
      size: data.size as "S" | "M" | "L",
    });

    return {
      success: true,
      data: null
    };

  } catch (error) {
    console.log("createPetBreed error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสายพันธุ์สัตว์เลี้ยง",
    };
  }
}

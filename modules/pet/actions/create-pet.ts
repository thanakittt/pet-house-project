"use server";

import { db } from "@/db";
import { PetForm } from "../types/pet";
import { petBreeds, pets } from "@/db/schema";
import { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";

export async function createPet(data: PetForm): Promise<ActionResponse<null>> {
  try {
    const activeBreed = await db.query.petBreeds.findFirst({
      where: and(
        eq(petBreeds.id, data.petBreedId),
        isNull(petBreeds.deletedAt),
      ),
    });

    if (!activeBreed) {
      return {
        success: false,
        error: "ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยง หรือสายพันธุ์ถูกลบไปแล้ว",
      };
    }

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

"use server";

import { db } from "@/db";
import { pets } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import { PetForm } from "../types/pet";
import {
  sanitizePetInput,
  validateActivePetBreed,
} from "./pet-action-helpers";

export async function createPet(data: PetForm): Promise<ActionResponse<null>> {
  try {
    const session = await requireStaff({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "ไม่มีสิทธิ์สร้างข้อมูลสัตว์เลี้ยง",
      };
    }

    const sanitized = sanitizePetInput(data);

    if (!sanitized.success) {
      return sanitized;
    }

    const activeBreed = await validateActivePetBreed(sanitized.data.petBreedId);

    if (!activeBreed.success) {
      return activeBreed;
    }

    await db.insert(pets).values({
      name: sanitized.data.name,
      medicalNotes: sanitized.data.medicalNotes,
      petBreedId: sanitized.data.petBreedId,
      customerId: data.customerId,
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("createPet error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสัตว์เลี้ยง",
    };
  }
}
